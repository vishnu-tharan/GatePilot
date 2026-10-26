const { createDemoData } = require("./src/demo-data");
// Isolated local preview: never reads .env or connects to the real database.
const path = require("node:path");
const fs = require("node:fs");
const { randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");
const localMongo = "C:/Program Files/MongoDB/Server/8.0/bin/mongod.exe";
if (!process.env.MONGOMS_SYSTEM_BINARY && fs.existsSync(localMongo))
  process.env.MONGOMS_SYSTEM_BINARY = localMongo;
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../.test-mongodb");
process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = "false";
const { MongoMemoryServer } = require("mongodb-memory-server");
const { mongoose } = require("./src/models");
const { createApp } = require("./src/app");
async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Demo mode is local-development only");
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const secret = `Preview-${randomBytes(10).toString("hex")}!`;
  const password = await bcrypt.hash(secret, 12);
  await createDemoData(password);
  const server = createApp().listen(Number(process.env.PORT || 5000), "127.0.0.1", () =>
    console.log(
      `GATEPILOT — SAMPLE CAMPUS. Independent prototype; fictional data only.\nAccounts: admin@preview.test, officer@preview.test, manager@preview.test\nPassword: ${secret}\nAPI: http://localhost:${server.address().port}`,
    ),
  );
  server.on("error", async (error) => {
    console.error(error.message);
    await mongoose.disconnect();
    await mongo.stop();
    process.exitCode = 1;
  });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      server.close(async () => {
        await mongoose.disconnect();
        await mongo.stop();
        process.exit(0);
      }),
    );
}
main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
