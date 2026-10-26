const { databaseUri } = require("./src/config");
require("dotenv").config();
const { createApp } = require("./src/app");
const { mongoose, User, VehicleRecord, Session, OrganizationSettings } = require("./src/models");
async function start() {
  await mongoose.connect(databaseUri());
  await Promise.all(
    [User, VehicleRecord, Session, OrganizationSettings].map((model) => model.init()),
  );
  const server = createApp().listen(process.env.PORT || 5000, "0.0.0.0", () =>
    console.log("GatePilot API ready"),
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () =>
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      }),
    );
}
start().catch(() => {
  console.error("Startup failed. Check database connectivity and unique indexes; see README.");
  process.exit(1);
});
