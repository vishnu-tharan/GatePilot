const mongoose = require("mongoose");
const { Schema } = mongoose;

// 1. Organization Settings (Campus name, active gates, and departments)
const OrganizationSettings = mongoose.model(
  "OrganizationSettings",
  new Schema(
    {
      key: {
        type: String,
        unique: true,
        default: "organization",
      },
      name: {
        type: String,
        default: "Sample Campus",
      },
      gates: [
        {
          name: { type: String, required: true },
          active: { type: Boolean, default: true },
        },
      ],
      departments: [
        {
          name: { type: String, required: true },
          active: { type: Boolean, default: true },
        },
      ],
    },
    { timestamps: true },
  ),
);

// 2. User Accounts (Admin, Security Guard, Department Manager)
const User = mongoose.model(
  "User",
  new Schema(
    {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      password: {
        type: String,
        required: true,
        select: false, // excluded by default in queries
      },
      role: {
        type: String,
        enum: ["superadmin", "admin", "security"], // superadmin=Org Admin, admin=Dept Manager, security=Gate Guard
        required: true,
      },
      gate: {
        type: String,
        default: "", // Assigned gate for security officers (e.g. North Gate)
      },
      department: {
        type: String,
        default: "", // Assigned department for managers (e.g. Operations)
      },
      active: {
        type: Boolean,
        default: true,
      },
      sessionVersion: {
        type: Number,
        default: 0,
      },
    },
    { timestamps: true },
  ),
);

// 3. Vehicle Visit Records
const vehicleSchema = new Schema(
  {
    passId: {
      type: String,
      unique: true,
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    driverIdentity: {
      type: String,
      default: "",
    },
    driverPhone: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      required: true,
    },
    carriedEquipment: {
      type: String,
      default: "",
    },
    entryNotes: {
      type: String,
      default: "",
    },
    approvalStatus: {
      type: String,
      enum: ["Approved", "Pending Approval", "Rejected"],
      default: "Approved",
    },
    gatePassNumber: {
      type: String,
      default: "",
    },
    inTime: {
      type: String,
      required: true,
    },
    outTime: {
      type: String,
      default: null, // null while vehicle is inside campus
    },
    entryGate: {
      type: String,
      required: true,
    },
    exitGate: {
      type: String,
      default: "",
    },
    exitEquipment: {
      type: String,
      default: "",
    },
    exitNotes: {
      type: String,
      default: "",
    },
    authorizedBy: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Ensures a vehicle cannot have two open visits at the same time
vehicleSchema.index(
  { vehicleNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { outTime: null },
    name: "one_active_visit_per_vehicle",
  },
);

const VehicleRecord = mongoose.model("VehicleRecord", vehicleSchema);

// 4. Session Tokens
const Session = mongoose.model(
  "Session",
  new Schema(
    {
      tokenHash: {
        type: String,
        unique: true,
        required: true,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      version: {
        type: Number,
        default: 0,
      },
      expiresAt: {
        type: Date,
        required: true,
        expires: 0, // MongoDB automatically deletes expired sessions
      },
    },
    { timestamps: true },
  ),
);

module.exports = {
  OrganizationSettings,
  User,
  VehicleRecord,
  Session,
  mongoose,
};
