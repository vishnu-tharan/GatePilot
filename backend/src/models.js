const mongoose = require("mongoose");
const { Schema } = mongoose;
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
        required: true,
      },
      gates: [
        {
          name: {
            type: String,
            required: true,
          },
          active: {
            type: Boolean,
            default: true,
          },
        },
      ],
      departments: [
        {
          name: {
            type: String,
            required: true,
          },
          active: {
            type: Boolean,
            default: true,
          },
        },
      ],
    },
    {
      timestamps: true,
      optimisticConcurrency: true,
    },
  ),
);
const User = mongoose.model(
  "User",
  new Schema(
    {
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
        select: false,
      },
      name: String,
      role: {
        type: String,
        enum: ["admin", "security", "superadmin"],
        required: true,
      },
      gate: String,
      department: String,
      active: {
        type: Boolean,
        default: true,
      },
      sessionVersion: {
        type: Number,
        default: 0,
      },
      failedLogins: {
        type: Number,
        default: 0,
      },
      lockedUntil: Date,
    },
    {
      timestamps: true,
    },
  ),
);
const vehicleSchema = new Schema(
  {
    passId: {
      type: String,
      unique: true,
    },
    inTime: String,
    outTime: {
      type: String,
      default: null,
    },
    vehicleNumber: String,
    driverName: String,
    driverIdentity: String,
    driverPhone: String,
    department: String,
    carriedEquipment: String,
    entryNotes: String,
    approvalStatus: String,
    gatePassNumber: String,
    exitEquipment: String,
    exitNotes: String,
    entryGate: String,
    exitGate: String,
    authorizedBy: String,
    createdBy: String,
  },
  {
    timestamps: true,
  },
);
vehicleSchema.index(
  {
    vehicleNumber: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      outTime: null,
    },
    name: "one_active_visit_per_vehicle",
  },
);
const VehicleRecord = mongoose.model("VehicleRecord", vehicleSchema);
const Session = mongoose.model(
  "Session",
  new Schema(
    {
      tokenHash: {
        type: String,
        unique: true,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      version: Number,
      expiresAt: {
        type: Date,
        expires: 0,
      },
    },
    {
      timestamps: true,
    },
  ),
);
module.exports = {
  OrganizationSettings,
  mongoose,
  User,
  VehicleRecord,
  Session,
};
