const { VehicleRecord } = require("../models");
const { requireSession, allowRoles } = require("../../middleware/authMiddleware");
const { randomUUID } = require("node:crypto");
const { asyncHandler, getDepartmentFilter } = require("../http");
const validation = require("../validation");

function registerVisitsRoutes(app) {
  // GET /vehicleRecord - Search and list vehicle visits
  app.get(
    "/vehicleRecord",
    requireSession,
    asyncHandler(async (req, res) => {
      const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
      const query = getDepartmentFilter(req);

      // Status filters
      if (req.query.status === "inside") {
        query.outTime = null;
      } else if (req.query.status === "pending") {
        query.approvalStatus = "Pending Approval";
        query.outTime = null;
      }

      // Gate filter
      if (req.query.gate && req.query.gate !== "All gates") {
        query.entryGate = req.query.gate;
      }

      // Text search (vehicle plate, driver name, or pass ID)
      if (typeof req.query.search === "string" && req.query.search.trim()) {
        const search = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query.$or = ["vehicleNumber", "driverName", "passId", "gatePassNumber"].map((field) => ({
          [field]: { $regex: search, $options: "i" },
        }));
      }

      const limit = 30;
      const [items, total] = await Promise.all([
        VehicleRecord.find(query)
          .sort({ _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        VehicleRecord.countDocuments(query),
      ]);

      res.json({
        items,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
      });
    }),
  );

  // POST /vehicleRecord - Record a new vehicle arrival (Security Officers only)
  app.post(
    "/vehicleRecord",
    allowRoles("security"),
    asyncHandler(async (req, res) => {
      const officerGate = req.user.gate || req.gates[0] || "Main Gate";
      const equipment = validation.text(req.body, "carriedEquipment", false, 1000);

      const record = await VehicleRecord.create({
        passId: randomUUID(),
        inTime: new Date().toISOString(),
        outTime: null,
        vehicleNumber: validation.plate(req.body),
        driverName: validation.text(req.body, "driverName", true),
        driverIdentity: validation.text(req.body, "driverIdentity", false, 50),
        driverPhone: validation.text(req.body, "driverPhone", false, 50),
        department: validation.choice(req.body, "department", req.departments),
        carriedEquipment: equipment,
        entryNotes: validation.text(req.body, "entryNotes", false, 1000),
        // If equipment is carried, require manager approval before exit
        approvalStatus: equipment ? "Pending Approval" : "Approved",
        entryGate: officerGate,
        createdBy: String(req.user._id),
      });

      res.status(201).json(record);
    }),
  );

  // PUT /vehicleRecord/status/:passId - Approve or Reject equipment request (Managers & Admins)
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
          gatePassNumber: status === "Approved" ? `GP-${Date.now().toString().slice(-6)}` : "",
        },
        { returnDocument: "after" },
      );

      if (!record) {
        validation.fail("Request already reviewed or visit closed.", 409);
      }

      res.json(record);
    }),
  );

  // PUT /vehicleRecord/resubmit/:passId - Resubmit rejected request with updated notes (Security Officers)
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
        { returnDocument: "after" },
      );

      if (!record) {
        validation.fail("Rejected active visit not found.", 409);
      }

      res.json(record);
    }),
  );

  // PUT /vehicleRecord/:vehicleNumber - Confirm Vehicle Departure (Security Officers only)
  app.put(
    "/vehicleRecord/:vehicleNumber",
    allowRoles("security"),
    asyncHandler(async (req, res) => {
      const officerGate = req.user.gate || req.gates[0] || "Main Gate";
      const exitEquipment = validation.text(req.body, "exitEquipment", false, 1000);
      const exitNotes = validation.text(req.body, "exitNotes", false, 1000);
      const passId = validation.text(req.body, "passId", true);
      const number = validation.plate({ vehicleNumber: req.params.vehicleNumber });

      const existing = await VehicleRecord.findOne({
        passId,
        vehicleNumber: number,
        outTime: null,
      });

      if (!existing) {
        validation.fail("Visit not found or already closed.", 409);
      }

      if (existing.approvalStatus !== "Approved") {
        validation.fail("Equipment approval is required before the vehicle can exit.", 409);
      }

      if (existing.carriedEquipment && !exitEquipment) {
        validation.fail("Please verify the carried equipment before confirming exit.");
      }

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
          exitGate: officerGate,
        },
        { returnDocument: "after" },
      );

      if (!record) {
        validation.fail("Visit was already closed in another session.", 409);
      }

      res.json(record);
    }),
  );
}

module.exports = { registerVisitsRoutes };
