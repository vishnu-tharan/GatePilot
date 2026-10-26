const { VehicleRecord } = require("../models");
const { verifyToken, roles } = require("../../middleware/authMiddleware");
const { randomUUID } = require("node:crypto");
const { wrap, scope } = require("../http");
const v = require("../validation");
function registerVisitsRoutes(app) {
  app.get(
    "/vehicleRecord",
    verifyToken,
    wrap(async (req, res) => {
      const page = Math.max(1, Math.min(Math.floor(Number(req.query.page)) || 1, 100000)),
        query = scope(req);
      if (req.query.status === "inside") query.outTime = null;
      if (req.query.status === "pending") {
        query.approvalStatus = "Pending Approval";
        query.outTime = null;
      }
      if (req.query.gate !== undefined) {
        query.entryGate = v.choice(
          req.query,
          "gate",
          req.settings.gates.map((item) => item.name),
        );
      }
      if (typeof req.query.search === "string" && req.query.search.trim()) {
        const search = req.query.search
          .trim()
          .slice(0, 80)
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query.$or = ["vehicleNumber", "driverName", "passId", "gatePassNumber"].map((k) => ({
          [k]: {
            $regex: search,
            $options: "i",
          },
        }));
      }
      const [items, total] = await Promise.all([
        VehicleRecord.find(query)
          .sort({
            _id: -1,
          })
          .skip((page - 1) * 30)
          .limit(30),
        VehicleRecord.countDocuments(query),
      ]);
      res.json({
        items,
        total,
        page,
        pages: Math.ceil(total / 30),
      });
    }),
  );
  app.post(
    "/vehicleRecord",
    roles("security"),
    wrap(async (req, res) => {
      if (!req.gates.includes(req.user.gate))
        v.fail("Ask an administrator to assign your gate", 403);
      const equipment = v.text(req.body, "carriedEquipment", false, 1000);
      const record = await VehicleRecord.create({
        passId: randomUUID(),
        inTime: new Date().toISOString(),
        outTime: null,
        vehicleNumber: v.plate(req.body),
        driverName: v.text(req.body, "driverName", true),
        driverIdentity: v.text(req.body, "driverIdentity", true, 30),
        driverPhone: v.text(req.body, "driverPhone", true, 30),
        department: v.choice(req.body, "department", req.departments),
        carriedEquipment: equipment,
        entryNotes: v.text(req.body, "entryNotes", false, 1000),
        approvalStatus: equipment ? "Pending Approval" : "Approved",
        entryGate: req.user.gate,
        createdBy: String(req.user._id),
      });
      res.status(201).json(record);
    }),
  );
  app.put(
    "/vehicleRecord/status/:passId",
    roles("admin", "superadmin"),
    wrap(async (req, res) => {
      const status = v.choice(req.body, "status", ["Approved", "Rejected"]);
      const record = await VehicleRecord.findOneAndUpdate(
        {
          ...scope(req),
          passId: req.params.passId,
          approvalStatus: "Pending Approval",
          outTime: null,
        },
        {
          approvalStatus: status,
          authorizedBy: req.user.name,
          gatePassNumber: status === "Approved" ? `GP-${randomUUID()}` : "",
        },
        {
          returnDocument: "after",
        },
      );
      if (!record) v.fail("Request unavailable or already reviewed", 409);
      res.json(record);
    }),
  );
  app.put(
    "/vehicleRecord/resubmit/:passId",
    roles("security"),
    wrap(async (req, res) => {
      const notes = v.text(req.body, "entryNotes", true, 1000);
      const record = await VehicleRecord.findOneAndUpdate(
        {
          passId: req.params.passId,
          approvalStatus: "Rejected",
          outTime: null,
        },
        {
          approvalStatus: "Pending Approval",
          entryNotes: notes,
          authorizedBy: "",
          gatePassNumber: "",
        },
        {
          returnDocument: "after",
        },
      );
      if (!record) v.fail("Rejected active request not found", 409);
      res.json(record);
    }),
  );
  app.put(
    "/vehicleRecord/:vehicleNumber",
    roles("security"),
    wrap(async (req, res) => {
      if (!req.gates.includes(req.user.gate)) v.fail("No gate assigned", 403);
      const exitEquipment = v.text(req.body, "exitEquipment", false, 1000),
        exitNotes = v.text(req.body, "exitNotes", false, 1000),
        passId = v.text(req.body, "passId", true),
        number = v.plate({
          vehicleNumber: req.params.vehicleNumber,
        });
      const existing = await VehicleRecord.findOne({
        passId,
        vehicleNumber: number,
        outTime: null,
      });
      if (!existing) v.fail("Visit unavailable or already closed. Refresh the list.", 409);
      if (existing.approvalStatus !== "Approved")
        v.fail("Equipment approval is required before exit", 409);
      if (existing.carriedEquipment && !exitEquipment)
        v.fail("Record the equipment verification before exit");
      const record = await VehicleRecord.findOneAndUpdate(
        {
          _id: existing._id,
          outTime: null,
          approvalStatus: "Approved",
        },
        {
          outTime: new Date().toISOString(),
          exitEquipment,
          exitNotes,
          exitGate: req.user.gate,
        },
        {
          returnDocument: "after",
        },
      );
      if (!record) v.fail("Visit already closed", 409);
      res.json(record);
    }),
  );
}
module.exports = { registerVisitsRoutes };
