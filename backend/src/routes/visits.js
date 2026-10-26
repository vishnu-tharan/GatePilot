const { VehicleRecord } = require("../models");
const { requireSession, allowRoles } = require("../../middleware/authMiddleware");
const { randomUUID } = require("node:crypto");
const { asyncHandler, getDepartmentFilter } = require("../http");
const validation = require("../validation");
function registerVisitsRoutes(app) {
  app.get(
    "/vehicleRecord",
    requireSession,
    asyncHandler(async (req, res) => {
      const page = Math.max(1, Math.min(Math.floor(Number(req.query.page)) || 1, 100000));
      const query = getDepartmentFilter(req);
      if (req.query.status === "inside") query.outTime = null;
      if (req.query.status === "pending") {
        query.approvalStatus = "Pending Approval";
        query.outTime = null;
      }
      if (req.query.gate !== undefined) {
        query.entryGate = validation.choice(
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
    allowRoles("security"),
    asyncHandler(async (req, res) => {
      if (!req.gates.includes(req.user.gate))
        validation.fail("Ask an administrator to assign your gate", 403);
      const equipment = validation.text(req.body, "carriedEquipment", false, 1000);
      const record = await VehicleRecord.create({
        passId: randomUUID(),
        inTime: new Date().toISOString(),
        outTime: null,
        vehicleNumber: validation.plate(req.body),
        driverName: validation.text(req.body, "driverName", true),
        driverIdentity: validation.text(req.body, "driverIdentity", true, 30),
        driverPhone: validation.text(req.body, "driverPhone", true, 30),
        department: validation.choice(req.body, "department", req.departments),
        carriedEquipment: equipment,
        entryNotes: validation.text(req.body, "entryNotes", false, 1000),
        approvalStatus: equipment ? "Pending Approval" : "Approved",
        entryGate: req.user.gate,
        createdBy: String(req.user._id),
      });
      res.status(201).json(record);
    }),
  );
  app.put(
    "/vehicleRecord/status/:passId",
    allowRoles("admin", "superadmin"),
    asyncHandler(async (req, res) => {
      const status = validation.choice(req.body, "status", ["Approved", "Rejected"]);
      const record = await VehicleRecord.findOneAndUpdate(
        {
          ...getDepartmentFilter(req),
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
      if (!record) validation.fail("Request unavailable or already reviewed", 409);
      res.json(record);
    }),
  );
  app.put(
    "/vehicleRecord/resubmit/:passId",
    allowRoles("security"),
    asyncHandler(async (req, res) => {
      const notes = validation.text(req.body, "entryNotes", true, 1000);
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
      if (!record) validation.fail("Rejected active request not found", 409);
      res.json(record);
    }),
  );
  app.put(
    "/vehicleRecord/:vehicleNumber",
    allowRoles("security"),
    asyncHandler(async (req, res) => {
      if (!req.gates.includes(req.user.gate)) validation.fail("No gate assigned", 403);
      const exitEquipment = validation.text(req.body, "exitEquipment", false, 1000);
      const exitNotes = validation.text(req.body, "exitNotes", false, 1000);
      const passId = validation.text(req.body, "passId", true);
      const number = validation.plate({
        vehicleNumber: req.params.vehicleNumber,
      });
      const existing = await VehicleRecord.findOne({
        passId,
        vehicleNumber: number,
        outTime: null,
      });
      if (!existing) validation.fail("Visit unavailable or already closed. Refresh the list.", 409);
      if (existing.approvalStatus !== "Approved")
        validation.fail("Equipment approval is required before exit", 409);
      if (existing.carriedEquipment && !exitEquipment)
        validation.fail("Record the equipment verification before exit");
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
      if (!record) validation.fail("Visit already closed", 409);
      res.json(record);
    }),
  );
}
module.exports = { registerVisitsRoutes };
