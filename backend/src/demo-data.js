const { randomUUID } = require("node:crypto");
const { User, VehicleRecord, Session, OrganizationSettings } = require("./models");
async function createDemoData(password) {
  await User.create([
    {
      name: "Demo Workspace Admin",
      email: "admin@preview.test",
      password,
      role: "superadmin",
    },
    {
      name: "Demo Gate Officer",
      email: "officer@preview.test",
      password,
      role: "security",
      gate: "North Gate",
    },
    {
      name: "Demo Department Admin",
      email: "manager@preview.test",
      password,
      role: "admin",
      department: "Operations",
    },
  ]);
  await Promise.all(
    [User, VehicleRecord, Session, OrganizationSettings].map((model) => model.init()),
  );
  for (const [index, number] of ["DEMO-001", "DEMO-002", "DEMO-003", "DEMO-004"].entries())
    await VehicleRecord.create({
      passId: randomUUID(),
      vehicleNumber: number,
      driverName: `Demo Visitor ${String(index + 1).padStart(2, "0")}`,
      driverIdentity: `DEMO-ID-${String(index + 1).padStart(3, "0")}`,
      driverPhone: "0000000000",
      department: ["Operations", "Engineering", "Administration", "Operations"][index],
      entryGate: ["North Gate", "East Gate", "West Gate", "North Gate"][index],
      inTime: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
      outTime: index === 2 ? new Date().toISOString() : null,
      approvalStatus: index === 0 ? "Pending Approval" : "Approved",
      carriedEquipment: index === 0 ? "2 demonstration laptops" : "",
    });
}
module.exports = { createDemoData };
