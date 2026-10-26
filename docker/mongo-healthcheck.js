const fs = require("fs");
const password = fs.readFileSync("/run/secrets/database_password", "utf8").trim();
const connection = new Mongo(
  `mongodb://gatepilot:${encodeURIComponent(password)}@127.0.0.1:27017/gatepilotDB?authSource=gatepilotDB`,
);
quit(connection.getDB("gatepilotDB").runCommand({ ping: 1 }).ok === 1 ? 0 : 1);
