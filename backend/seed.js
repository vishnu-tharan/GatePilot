const { databaseUri } = require("./src/config");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { mongoose, User } = require("./src/models");
const { createDemoData } = require("./src/demo-data");
const { getSettings } = require("./src/settings");

async function seed() {
  const uri = databaseUri();
  console.log(`Connecting to database at: ${uri}`);
  await mongoose.connect(uri);

  const count = await User.countDocuments();
  if (count > 0) {
    console.log(`Database already has ${count} user account(s). Existing data preserved.`);
    return;
  }

  const defaultPassword = await bcrypt.hash("password123", 10);
  await createDemoData(defaultPassword);
  await getSettings();

  console.log("\n==================================================");
  console.log(" Database seeded successfully!");
  console.log(" Database: gatepilotDB");
  console.log(" Accounts created:");
  console.log("   • Guard:   officer@preview.test (password123)");
  console.log("   • Manager: manager@preview.test (password123)");
  console.log("   • Admin:   admin@preview.test (password123)");
  console.log(" You can now refresh MongoDB Compass to see 'gatepilotDB'!");
  console.log("==================================================\n");
}

seed()
  .catch((e) => {
    console.error("Seeding error:", e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
