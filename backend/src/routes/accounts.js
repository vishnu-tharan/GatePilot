const { mongoose, User, Session } = require("../models");
const { allowRoles } = require("../../middleware/authMiddleware");
const { asyncHandler, toPublicUser } = require("../http");
const bcrypt = require("bcryptjs");
const validation = require("../validation");
function registerAccountsRoutes(app) {
  app.get(
    "/user",
    allowRoles("superadmin"),
    asyncHandler(async (req, res) => {
      const users = await User.find({ active: { $ne: false } }).sort({ name: 1 });
      res.json(users.map(toPublicUser));
    }),
  );
  app.post(
    "/user",
    allowRoles("superadmin"),
    asyncHandler(async (req, res) => {
      const role = validation.choice(req.body, "role", ["security", "admin"]);
      const user = await User.create({
        name: validation.text(req.body, "name", true),
        email: validation.email(req.body),
        password: await bcrypt.hash(validation.password(req.body.password), 12),
        role,
        gate: role === "security" ? validation.choice(req.body, "gate", req.gates) : "",
        department:
          role === "admin" ? validation.choice(req.body, "department", req.departments) : "",
      });
      res.status(201).json(toPublicUser(user));
    }),
  );
  app.put(
    "/user/:id",
    allowRoles("superadmin"),
    asyncHandler(async (req, res) => {
      if (!mongoose.isValidObjectId(req.params.id)) validation.fail("Invalid account");
      const existing = await User.findById(req.params.id);
      if (!existing || existing.role === "superadmin")
        validation.fail("Account cannot be edited here", 403);
      const user = await User.findByIdAndUpdate(
        existing._id,
        {
          name: validation.text(req.body, "name", true),
          gate: existing.role === "security" ? validation.choice(req.body, "gate", req.gates) : "",
          department:
            existing.role === "admin"
              ? validation.choice(req.body, "department", req.departments)
              : "",
        },
        {
          returnDocument: "after",
        },
      );
      res.json(toPublicUser(user));
    }),
  );
  app.delete(
    "/user/:id",
    allowRoles("superadmin"),
    asyncHandler(async (req, res) => {
      if (!mongoose.isValidObjectId(req.params.id)) validation.fail("Invalid account");
      const user = await User.findOneAndUpdate(
        {
          _id: req.params.id,
          role: {
            $ne: "superadmin",
          },
        },
        {
          active: false,
          $inc: {
            sessionVersion: 1,
          },
        },
      );
      if (!user) validation.fail("Account not found", 404);
      await Session.deleteMany({
        userId: user._id,
      });
      res.json({
        message: "Account disabled",
      });
    }),
  );
}
module.exports = { registerAccountsRoutes };
