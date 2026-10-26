const fs = require("node:fs");
const bcrypt = require("bcryptjs");
const { mongoose, User, VehicleRecord, Session, OrganizationSettings } = require("../src/models");
const { databaseUri } = require("../src/config");
const { createDemoData } = require("../src/demo-data");
const { password: validatePassword } = require("../src/validation");

async function setup() {
  await mongoose.connect(databaseUri());
  await Promise.all(
    [User, VehicleRecord, Session, OrganizationSettings].map((model) => model.init()),
  );
  if (await User.exists({ role: "superadmin", active: { $ne: false } })) {
    console.log("Workspace already initialized; existing accounts and records preserved.");
    return;
  }
  if (await User.exists({}))
    throw new Error("Existing workspace needs administrator recovery; no accounts changed.");
  const secret = validatePassword(fs.readFileSync("/run/secrets/starter_password", "utf8").trim());
  await createDemoData(await bcrypt.hash(secret, 12));
  console.log("Fictional starter workspace created. Use the local credentials command to sign in.");
}
setup()
  .catch(() => {
    console.error("Local setup failed. Check database readiness and secret files.");
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
