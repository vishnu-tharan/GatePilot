const { mongoose, User, Session } = require("../models");
const { roles } = require("../../middleware/authMiddleware");
const { wrap, publicUser } = require("../http");
const bcrypt = require("bcryptjs");
const v = require("../validation");
function registerAccountsRoutes(app) {
  app.get(
    "/user",
    roles("superadmin"),
    wrap(async (req, res) => {
      const users = await User.find({ active: { $ne: false } }).sort({ name: 1 });
      res.json(users.map(publicUser));
    }),
  );
  app.post(
    "/user",
    roles("superadmin"),
    wrap(async (req, res) => {
      const role = v.choice(req.body, "role", ["security", "admin"]);
      const user = await User.create({
        name: v.text(req.body, "name", true),
        email: v.email(req.body),
        password: await bcrypt.hash(v.password(req.body.password), 12),
        role,
        gate: role === "security" ? v.choice(req.body, "gate", req.gates) : "",
        department: role === "admin" ? v.choice(req.body, "department", req.departments) : "",
      });
      res.status(201).json(publicUser(user));
    }),
  );
  app.put(
    "/user/:id",
    roles("superadmin"),
    wrap(async (req, res) => {
      if (!mongoose.isValidObjectId(req.params.id)) v.fail("Invalid account");
      const existing = await User.findById(req.params.id);
      if (!existing || existing.role === "superadmin") v.fail("Account cannot be edited here", 403);
      const user = await User.findByIdAndUpdate(
        existing._id,
        {
          name: v.text(req.body, "name", true),
          gate: existing.role === "security" ? v.choice(req.body, "gate", req.gates) : "",
          department:
            existing.role === "admin" ? v.choice(req.body, "department", req.departments) : "",
        },
        {
          returnDocument: "after",
        },
      );
      res.json(publicUser(user));
    }),
  );
  app.delete(
    "/user/:id",
    roles("superadmin"),
    wrap(async (req, res) => {
      if (!mongoose.isValidObjectId(req.params.id)) v.fail("Invalid account");
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
      if (!user) v.fail("Account not found", 404);
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
