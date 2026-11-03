const fs = require("node:fs");

function databaseUri(environment = process.env) {
  if (environment.MONGO_URI) return environment.MONGO_URI;
  if (!environment.MONGO_PASSWORD_FILE) return "mongodb://127.0.0.1:27017/gatepilotDB";
  const password = fs.readFileSync(environment.MONGO_PASSWORD_FILE, "utf8").trim();
  if (!password) throw new Error("Database password is missing");
  const user = encodeURIComponent(environment.MONGO_USER || "gatepilot");
  const host = environment.MONGO_HOST || "mongo:27017";
  const database = encodeURIComponent(environment.MONGO_DATABASE || "gatepilotDB");
  return `mongodb://${user}:${encodeURIComponent(password)}@${host}/${database}?authSource=${database}`;
}

module.exports = { databaseUri };
