const { databaseUri } = require("./src/config");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { createApp } = require("./src/app");
const { mongoose, User, VehicleRecord, Session, OrganizationSettings } = require("./src/models");
const { createDemoData } = require("./src/demo-data");
const { getSettings } = require("./src/settings");

async function start() {
  const uri = databaseUri();
  console.log(`Connecting to MongoDB at: ${uri}`);

  await mongoose.connect(uri);

  // Initialize indexes
  await Promise.all(
    [User, VehicleRecord, Session, OrganizationSettings].map((model) => model.init()),
  );

  // If database is brand new, auto-seed starter accounts and records
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log("Empty database detected. Initializing starter accounts and sample visits...");
    const defaultPassword = await bcrypt.hash("password123", 10);
    await createDemoData(defaultPassword);
    await getSettings(); // initialize default gates & departments
    console.log("Starter data created successfully!");
  }

  const port = process.env.PORT || 5000;
  const server = createApp().listen(port, "0.0.0.0", () => {
    console.log("\n==================================================");
    console.log(" GATEPILOT - BACKEND API SERVER RUNNING");
    console.log("==================================================");
    console.log(` API Endpoint:     http://localhost:${port}`);
    console.log(` Connected DB:     ${uri}`);
    console.log(" View in Compass:  Connect to localhost:27017 -> gatepilotDB");
    console.log("==================================================\n");
  });

  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () =>
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      }),
    );
  }
}

start().catch((err) => {
  console.error("\n[ERROR] Database connection failed:");
  console.error(err.message);
  console.error("\nPlease make sure your local MongoDB server is running on port 27017.");
  console.error("Tip: Start the MongoDB service or run 'mongod' from the terminal.\n");
  process.exit(1);
});
