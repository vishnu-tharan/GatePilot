const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const localMongo = "C:/Program Files/MongoDB/Server/8.0/bin/mongod.exe";
if (!process.env.MONGOMS_SYSTEM_BINARY && fs.existsSync(localMongo)) {
  process.env.MONGOMS_SYSTEM_BINARY = localMongo;
  process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = "false";
}
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.test-mongodb");
process.env.MONGOMS_VERSION = "8.2.1";
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const { mongoose, User, VehicleRecord, Session, OrganizationSettings } = require("../src/models");
const { createApp } = require("../src/app");
const { hashSessionToken } = require("../middleware/authMiddleware");
const { randomBytes } = require("node:crypto");
let mongo;
let app;
let passwordHash;
let users;
let tokens;
before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([User.init(), VehicleRecord.init(), Session.init()]);
  passwordHash = await bcrypt.hash("StrongPassword123!", 12);
});
after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Session.deleteMany({}),
    VehicleRecord.deleteMany({}),
    OrganizationSettings.deleteMany({}),
  ]);
  app = createApp();
  users = {};
  tokens = {};
  for (const [key, role, department, gate] of [
    ["officer", "security", "", "North Gate"],
    ["manager", "admin", "Operations", ""],
    ["other", "admin", "Engineering", ""],
    ["root", "superadmin", "", ""],
  ]) {
    users[key] = await User.create({
      email: `${key}@preview.test`,
      name: key,
      password: passwordHash,
      role,
      department,
      gate,
    });
    tokens[key] = randomBytes(32).toString("hex");
    await Session.create({
      tokenHash: hashSessionToken(tokens[key]),
      userId: users[key]._id,
      version: 0,
      expiresAt: new Date(Date.now() + 3600000),
    });
  }
});
function call(method, url, who = "officer", body) {
  const req = request(app)[method](url).set("X-GatePilot-Client", "gatepilot");
  if (who) req.set("Authorization", `Bearer ${tokens[who]}`);
  return body === undefined ? req : req.send(body);
}
const entry = (extra) => ({
  vehicleNumber: "DEMO-005",
  driverName: "Visitor",
  driverIdentity: "DEMO-ID-005",
  driverPhone: "0000000000",
  department: "Operations",
  ...extra,
});
async function enter(extra) {
  const result = await call("post", "/vehicleRecord", "officer", entry(extra));
  assert.equal(result.status, 201, JSON.stringify(result.body));
  return result.body;
}
function depart(passId, extra = {}) {
  return call("put", "/vehicleRecord/DEMO-005", "officer", {
    passId,
    ...extra,
  });
}
test("anonymous access, forged tokens, CSRF and untrusted origins are rejected", async () => {
  assert.equal((await request(app).get("/vehicleRecord")).status, 401);
  assert.equal(
    (
      await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${"a".repeat(64)}`)
    ).status,
    401,
  );
  assert.equal((await request(app).post("/user/login").send({})).status, 403);
  assert.equal(
    (await call("post", "/user/login", null, {}).set("Origin", "https://evil.example")).status,
    403,
  );
});
test("browser login uses HttpOnly SameSite cookie and hides bearer token", async () => {
  const res = await call("post", "/user/login", null, {
    email: "root@preview.test",
    password: "StrongPassword123!",
  }).set("Origin", "http://localhost:8081");
  assert.equal(res.status, 200);
  assert.equal(res.body.token, undefined);
  assert.equal(res.body.user.password, undefined);
  const cookie = res.headers["set-cookie"][0];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.equal(
    (await request(app).get("/user/me").set("Cookie", cookie.split(";")[0])).status,
    200,
  );
});
test("native login token is hashed in the database and logout revokes it", async () => {
  const res = await call("post", "/user/login", null, {
    email: "root@preview.test",
    password: "StrongPassword123!",
  });
  assert.equal(res.status, 200);
  assert.ok(
    await Session.exists({
      tokenHash: hashSessionToken(res.body.token),
    }),
  );
  await request(app)
    .post("/user/logout")
    .set("X-GatePilot-Client", "gatepilot")
    .set("Authorization", `Bearer ${res.body.token}`)
    .expect(200);
  await request(app).get("/user/me").set("Authorization", `Bearer ${res.body.token}`).expect(401);
});
test("NoSQL login payload and oversized input are rejected", async () => {
  assert.equal(
    (
      await call("post", "/user/login", null, {
        email: {
          $ne: null,
        },
        password: "x",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        "post",
        "/vehicleRecord",
        "officer",
        entry({
          driverName: "a".repeat(161),
        }),
      )
    ).status,
    400,
  );
});
test("weak credentials cannot sign in and password whitespace is preserved", async () => {
  await User.updateOne(
    {
      _id: users.officer._id,
    },
    {
      password: await bcrypt.hash("123", 12),
    },
  );
  assert.equal(
    (
      await call("post", "/user/login", null, {
        email: "officer@preview.test",
        password: "123",
      })
    ).status,
    401,
  );
  const spaced = " StrongPassword123! ";
  await User.updateOne(
    {
      _id: users.officer._id,
    },
    {
      password: await bcrypt.hash(spaced, 12),
    },
  );
  assert.equal(
    (
      await call("post", "/user/login", null, {
        email: "officer@preview.test",
        password: spaced,
      })
    ).status,
    200,
  );
});
test("five incorrect passwords temporarily lock the account", async () => {
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await call("post", "/user/login", null, {
          email: "root@preview.test",
          password: "wrong",
        })
      ).status,
      401,
    );
  assert.equal(
    (
      await call("post", "/user/login", null, {
        email: "root@preview.test",
        password: "StrongPassword123!",
      })
    ).status,
    401,
  );
});
test("server owns approval state, gate, pass ID and timestamps", async () => {
  const record = await enter({
    carriedEquipment: "2 laptops",
    approvalStatus: "Approved",
    authorizedBy: "Forged manager",
    entryGate: "East Gate",
    inTime: "1990-01-01",
    outTime: "now",
    passId: "fake",
  });
  assert.equal(record.approvalStatus, "Pending Approval");
  assert.equal(record.entryGate, "North Gate");
  assert.equal(record.outTime, null);
  assert.notEqual(record.passId, "fake");
  assert.equal(record.authorizedBy, undefined);
  assert.match(record.inTime, /^\d{4}-\d\d-\d\dT/);
});
test("concurrent entries allow only one active visit; normalized plates cannot bypass uniqueness", async () => {
  const results = await Promise.all([
    call("post", "/vehicleRecord", "officer", entry()),
    call(
      "post",
      "/vehicleRecord",
      "officer",
      entry({
        vehicleNumber: "demo- 005",
      }),
    ),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal(await VehicleRecord.countDocuments(), 1);
});

test("workspace settings disclose only the name publicly and require privileged writes", async () => {
  assert.deepEqual((await call("get", "/workspace", null)).body, { name: "Sample Campus" });
  assert.equal((await call("get", "/settings", null)).status, 401);
  assert.equal((await call("get", "/settings", "officer")).status, 200);
  for (const who of ["officer", "manager"]) {
    assert.equal((await call("post", "/settings/gates", who, { name: "Demo Gate" })).status, 403);
    assert.equal(
      (await call("put", "/settings/organization", who, { name: "Demo Works" })).status,
      403,
    );
  }
  assert.equal(
    (await call("put", "/settings/organization", "root", { name: "Demo Works" })).status,
    200,
  );
  assert.deepEqual((await call("get", "/workspace", null)).body, { name: "Demo Works" });
});

test("new gates and departments work in assignments, entries and filters", async () => {
  assert.equal(
    (await call("post", "/settings/gates", "root", { name: "  Service   Gate " })).status,
    201,
  );
  assert.equal(
    (await call("post", "/settings/departments", "root", { name: "Logistics" })).status,
    201,
  );
  assert.equal(
    (
      await call("put", `/user/${users.officer._id}`, "root", {
        name: "Demo Officer",
        gate: "Service Gate",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await call("put", `/user/${users.manager._id}`, "root", {
        name: "Demo Manager",
        department: "Logistics",
      })
    ).status,
    200,
  );
  const record = await enter({ department: "Logistics", carriedEquipment: "Demo laptop" });
  assert.equal(record.entryGate, "Service Gate");
  assert.equal((await call("get", "/vehicleRecord?gate=Service%20Gate", "manager")).body.total, 1);
  assert.equal((await call("get", "/vehicleRecord?gate=Service%20Gate", "other")).body.total, 0);
  assert.equal(
    (await call("get", "/dashboard", "manager")).body.gates.find(
      (gate) => gate.gate === "Service Gate",
    ).inside,
    1,
  );
  assert.equal(
    (await call("put", `/vehicleRecord/status/${record.passId}`, "manager", { status: "Approved" }))
      .status,
    200,
  );
});

test("setting retirement validates dependencies and preserves past visits and stable identities", async () => {
  const settings = (await call("get", "/settings", "root")).body;
  const north = settings.gates.find((item) => item.name === "North Gate");
  const east = settings.gates.find((item) => item.name === "East Gate");
  const west = settings.gates.find((item) => item.name === "West Gate");
  const operations = settings.departments.find((item) => item.name === "Operations");
  assert.equal(
    (await call("put", `/settings/gates/${north._id}`, "root", { active: false })).status,
    409,
  );
  assert.equal(
    (await call("put", "/settings/gates/not-an-id", "root", { active: false })).status,
    404,
  );
  assert.equal(
    (await call("put", `/settings/gates/${east._id}`, "root", { active: "false" })).status,
    400,
  );
  const visit = await enter();
  assert.equal((await depart(visit.passId)).status, 200);
  await call("put", `/user/${users.officer._id}`, "root", {
    name: "Demo Officer",
    gate: "East Gate",
  });
  assert.equal(
    (await call("put", `/settings/gates/${north._id}`, "root", { active: false })).status,
    200,
  );
  assert.equal((await call("get", "/vehicleRecord?gate=North%20Gate", "root")).body.total, 1);
  assert.equal(
    (
      await call("put", `/user/${users.officer._id}`, "root", {
        name: "Demo Officer",
        gate: "North Gate",
      })
    ).status,
    400,
  );
  assert.equal(
    (await call("put", `/settings/gates/${west._id}`, "root", { active: false })).status,
    200,
  );
  await call("delete", `/user/${users.officer._id}`, "root");
  assert.equal(
    (await call("put", `/settings/gates/${east._id}`, "root", { active: false })).status,
    409,
  );
  const restored = await call("put", `/settings/gates/${north._id}`, "root", { active: true });
  assert.equal(restored.body.gates.find((item) => item.name === "North Gate")._id, north._id);
  assert.equal(
    (await call("put", `/settings/departments/${operations._id}`, "root", { active: false }))
      .status,
    409,
  );
  await call("delete", `/user/${users.manager._id}`, "root");
  await VehicleRecord.updateOne({ passId: visit.passId }, { outTime: null });
  assert.equal(
    (await call("put", `/settings/departments/${operations._id}`, "root", { active: false }))
      .status,
    409,
  );
  await VehicleRecord.updateOne({ passId: visit.passId }, { outTime: new Date().toISOString() });
  assert.equal(
    (await call("put", `/settings/departments/${operations._id}`, "root", { active: false }))
      .status,
    200,
  );
});

test("duplicate and concurrent settings changes cannot silently overwrite each other", async () => {
  assert.equal((await call("post", "/settings/gates", "root", { name: "north gate" })).status, 409);
  assert.equal((await call("post", "/settings/departments", "root", { name: "x" })).status, 400);
  const results = await Promise.all([
    call("post", "/settings/gates", "root", { name: "Demo Gate" }),
    call("post", "/settings/gates", "root", { name: "DEMO GATE" }),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  assert.equal(
    (await call("get", "/settings", "root")).body.gates.filter(
      (item) => item.name.toLowerCase() === "demo gate",
    ).length,
    1,
  );
});
test("department isolation applies to reads, dashboard and approval writes", async () => {
  const item = await enter({
    carriedEquipment: "Laptop",
  });
  assert.equal((await call("get", "/vehicleRecord", "other")).body.total, 0);
  assert.equal((await call("get", "/dashboard", "other")).body.inside, 0);
  assert.equal(
    (
      await call("put", `/vehicleRecord/status/${item.passId}`, "other", {
        status: "Approved",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call("put", `/vehicleRecord/status/${item.passId}`, "officer", {
        status: "Approved",
      })
    ).status,
    403,
  );
});
test("arrival-gate filters combine with status, search and department permissions", async () => {
  await enter({
    vehicleNumber: "DEMO-201",
    carriedEquipment: "Demo laptop",
  });
  await User.updateOne(
    {
      _id: users.officer._id,
    },
    {
      gate: "East Gate",
    },
  );
  await enter({
    vehicleNumber: "DEMO-202",
    department: "Engineering",
  });
  const north = await call("get", "/vehicleRecord?gate=North%20Gate&status=pending", "root");
  assert.equal(north.status, 200);
  assert.equal(north.body.total, 1);
  assert.equal(north.body.items[0].vehicleNumber, "DEMO-201");
  const east = await call(
    "get",
    "/vehicleRecord?gate=East%20Gate&status=inside&search=DEMO-202",
    "root",
  );
  assert.equal(east.body.total, 1);
  assert.equal((await call("get", "/vehicleRecord?gate=East%20Gate", "manager")).body.total, 0);
  for (const gate of ["Unknown Gate", "", '{"$ne":null}']) {
    assert.equal(
      (await call("get", `/vehicleRecord?gate=${encodeURIComponent(gate)}`, "root")).status,
      400,
    );
  }
});
test("pending and rejected equipment exits are blocked; rejected requests can be resubmitted", async () => {
  const item = await enter({
    carriedEquipment: "Laptop",
  });
  assert.equal((await depart(item.passId)).status, 409);
  await call("put", `/vehicleRecord/status/${item.passId}`, "manager", {
    status: "Rejected",
  });
  assert.equal((await depart(item.passId)).status, 409);
  assert.equal(
    (
      await call("put", `/vehicleRecord/resubmit/${item.passId}`, "officer", {
        entryNotes: "Corrected ownership documentation provided",
      })
    ).status,
    200,
  );
  assert.equal((await VehicleRecord.findOne()).approvalStatus, "Pending Approval");
});
test("approval is atomic, attributed to the authenticated administrator and requires exit verification", async () => {
  const item = await enter({
    carriedEquipment: "Laptop",
  });
  const results = await Promise.all([
    call("put", `/vehicleRecord/status/${item.passId}`, "manager", {
      status: "Approved",
      authorizedBy: "fake",
    }),
    call("put", `/vehicleRecord/status/${item.passId}`, "manager", {
      status: "Rejected",
    }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const record = await VehicleRecord.findOne();
  assert.equal(record.authorizedBy, "manager");
  if (record.approvalStatus === "Rejected") {
    await call("put", `/vehicleRecord/resubmit/${item.passId}`, "officer", {
      entryNotes: "Ownership verified",
    });
    await call("put", `/vehicleRecord/status/${item.passId}`, "manager", {
      status: "Approved",
    });
  }
  assert.equal((await depart(item.passId)).status, 400);
  assert.equal(
    (
      await depart(item.passId, {
        exitEquipment: "Laptop serial checked",
        exitGate: "fake",
        outTime: "1990",
      })
    ).status,
    200,
  );
  assert.equal((await VehicleRecord.findOne()).exitGate, "North Gate");
});
test("concurrent departures close a visit only once; returning vehicles may enter again", async () => {
  const item = await enter();
  const results = await Promise.all([depart(item.passId), depart(item.passId)]);
  assert.equal(results.filter((r) => r.status === 200).length, 1);
  await enter();
  assert.equal(await VehicleRecord.countDocuments(), 2);
});
test("stale departure and retries cannot close a newer visit for the same vehicle", async () => {
  const original = await enter();
  assert.equal((await depart(original.passId)).status, 200);
  const returning = await enter();
  assert.equal(
    (
      await depart(original.passId, {
        exitNotes: "Old verification",
      })
    ).status,
    409,
  );
  assert.equal((await call("put", "/vehicleRecord/DEMO-005", "officer", {})).status, 400);
  assert.equal(
    (
      await call("put", "/vehicleRecord/OTHER-123", "officer", {
        passId: returning.passId,
      })
    ).status,
    409,
  );
  const active = await VehicleRecord.findOne({
    passId: returning.passId,
  });
  assert.equal(active.outTime, null);
  assert.equal(active.exitNotes, undefined);
  assert.equal((await depart(returning.passId)).status, 200);
});
test("only organization administrators create accounts and weak passwords are rejected", async () => {
  const body = {
    email: "new@preview.test",
    name: "New Officer",
    role: "security",
    gate: "East Gate",
    password: "StrongPassword123!",
  };
  assert.equal((await call("post", "/user", "manager", body)).status, 403);
  assert.equal(
    (
      await call("post", "/user", "root", {
        ...body,
        password: "123",
      })
    ).status,
    400,
  );
  assert.equal((await call("post", "/user", "root", body)).status, 201);
  assert.equal(
    (await call("get", "/user", "root")).body.some((u) => u.password),
    false,
  );
});
test("profile edits cannot escalate role or alter department, email, or gate", async () => {
  const res = await call("put", "/user/me", "officer", {
    name: "Updated",
    role: "superadmin",
    department: "Engineering",
    email: "hacker@preview.test",
    gate: "East Gate",
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.name, "Updated");
  assert.equal(res.body.role, "security");
  assert.equal(res.body.gate, "North Gate");
  assert.equal(res.body.email, "officer@preview.test");
});
test("password changes require current password and revoke every session", async () => {
  assert.equal(
    (
      await call("post", "/user/password", "officer", {
        currentPassword: "wrong",
        newPassword: "NewStrongPassword123!",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("post", "/user/password", "officer", {
        currentPassword: "StrongPassword123!",
        newPassword: "NewStrongPassword123!",
      })
    ).status,
    200,
  );
  assert.equal((await call("get", "/user/me")).status, 401);
  assert.equal(
    (
      await call("post", "/user/login", null, {
        email: "officer@preview.test",
        password: "NewStrongPassword123!",
      })
    ).status,
    200,
  );
});
test("disabled accounts and expired sessions lose access immediately", async () => {
  assert.equal((await call("delete", `/user/${users.officer._id}`, "root")).status, 200);
  assert.equal((await call("get", "/vehicleRecord")).status, 401);
  await Session.updateOne(
    {
      userId: users.manager._id,
    },
    {
      expiresAt: new Date(0),
    },
  );
  assert.equal((await call("get", "/user/me", "manager")).status, 401);
});

test("editing a profile preserves unrelated stored fields and records", async () => {
  const savedRecord = await mongoose.connection
    .collection("savedrecords")
    .insertOne({ note: "Keep this record" });
  await User.collection.updateOne(
    { _id: users.officer._id },
    { $set: { extraDetail: "Keep this detail" } },
  );
  const response = await call("put", "/user/me", "officer", { name: "Demo Officer" });
  assert.equal(response.status, 200);
  assert.equal(
    (await User.collection.findOne({ _id: users.officer._id })).extraDetail,
    "Keep this detail",
  );
  assert.equal(
    (await mongoose.connection.collection("savedrecords").findOne({ _id: savedRecord.insertedId }))
      .note,
    "Keep this record",
  );
});

test("only organization administrators can list accounts", async () => {
  assert.equal((await call("get", "/user", "officer")).status, 403);
  assert.equal((await call("get", "/user", "manager")).status, 403);
  const response = await call("get", "/user", "root");
  assert.equal(response.status, 200);
  assert.equal(response.body.length, 4);
  assert.equal(
    response.body.some((user) => user.password),
    false,
  );
});
