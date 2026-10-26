const fs = require("fs");
const password = fs.readFileSync("/run/secrets/database_password", "utf8").trim();
if (!password) throw new Error("Database password is missing");
db.getSiblingDB("gatepilotDB").createUser({
  user: "gatepilot",
  pwd: password,
  roles: [{ role: "readWrite", db: "gatepilotDB" }],
});
