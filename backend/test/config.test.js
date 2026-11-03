const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { databaseUri } = require("../src/config");

test("database configuration preserves explicit connections and supports encoded file secrets", () => {
  assert.equal(databaseUri({}), "mongodb://127.0.0.1:27017/gatepilotDB");
  assert.equal(
    databaseUri({ MONGO_URI: "mongodb://example.test/sample" }),
    "mongodb://example.test/sample",
  );
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "gatepilot-config-"));
  const secretFile = path.join(directory, "password");
  try {
    fs.writeFileSync(secretFile, "Local:@/ secret\n");
    assert.equal(
      databaseUri({
        MONGO_PASSWORD_FILE: secretFile,
        MONGO_USER: "sample@user",
        MONGO_HOST: "mongo:27017",
        MONGO_DATABASE: "gatepilotDB",
      }),
      "mongodb://sample%40user:Local%3A%40%2F%20secret@mongo:27017/gatepilotDB?authSource=gatepilotDB",
    );
    fs.writeFileSync(secretFile, "");
    assert.throws(() => databaseUri({ MONGO_PASSWORD_FILE: secretFile }), /password is missing/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
