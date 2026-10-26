const { User, Session } = require("../models");
const { requireSession, hashSessionToken } = require("../../middleware/authMiddleware");
const { randomBytes } = require("node:crypto");
const { asyncHandler, toPublicUser, getSessionCookieOptions } = require("../http");
const bcrypt = require("bcryptjs");
const validation = require("../validation");
function registerAuthenticationRoutes(app, { loginLimiter }) {
  app.post(
    "/user/login",
    loginLimiter,
    asyncHandler(async (req, res) => {
      const email = validation.text(req.body, "email", true, 254).toLowerCase();
      const password = validation.secret(req.body, "password");
      const user = await User.findOne({
        email,
      }).select("+password");
      const valid = await bcrypt.compare(
        password,
        user?.password || "$2b$12$C6UzMDM.H6dfI/f/IKcEe.2lH3RBvPxYyAWOLhaVMo.pKUW5.Qp5m",
      );
      if (
        !user ||
        !valid ||
        password.length < 12 ||
        user.active === false ||
        user.lockedUntil > new Date()
      ) {
        if (user && !(user.lockedUntil > new Date())) {
          const updated = await User.findByIdAndUpdate(
            user._id,
            {
              $inc: {
                failedLogins: 1,
              },
            },
            {
              returnDocument: "after",
            },
          );
          if (updated.failedLogins >= 5)
            await User.updateOne(
              {
                _id: user._id,
              },
              {
                lockedUntil: new Date(Date.now() + 15 * 60_000),
                failedLogins: 0,
              },
            );
        }
        return res.status(401).json({
          message: "Invalid credentials or temporarily locked account.",
        });
      }
      await User.updateOne(
        {
          _id: user._id,
        },
        {
          failedLogins: 0,
          lockedUntil: null,
        },
      );
      const token = randomBytes(32).toString("hex");
      await Session.create({
        tokenHash: hashSessionToken(token),
        userId: user._id,
        version: user.sessionVersion || 0,
        expiresAt: new Date(Date.now() + 8 * 60 * 60_000),
      });
      req.user = user;
      res.cookie("gatepilot_session", token, getSessionCookieOptions());
      res.json({
        user: toPublicUser(user),
        ...(!req.headers.origin
          ? {
              token,
            }
          : {}),
      });
    }),
  );
  app.get("/user/me", requireSession, (req, res) => res.json(toPublicUser(req.user)));
  app.put(
    "/user/me",
    requireSession,
    asyncHandler(async (req, res) => {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          name: validation.text(req.body, "name", true),
        },
        {
          returnDocument: "after",
        },
      );
      res.json(toPublicUser(user));
    }),
  );
  app.post(
    "/user/password",
    requireSession,
    loginLimiter,
    asyncHandler(async (req, res) => {
      const user = await User.findById(req.user._id).select("+password");
      const current = validation.secret(req.body, "currentPassword");
      const password = validation.password(req.body.newPassword);
      if (!(await bcrypt.compare(current, user.password)))
        validation.fail("Current password is incorrect");
      if (current === password) validation.fail("Choose a different password");
      await User.updateOne(
        {
          _id: user._id,
        },
        {
          $set: {
            password: await bcrypt.hash(password, 12),
          },
          $inc: {
            sessionVersion: 1,
          },
        },
      );
      await Session.deleteMany({
        userId: user._id,
      });
      res.clearCookie("gatepilot_session", {
        ...getSessionCookieOptions(),
        maxAge: undefined,
      });
      res.json({
        message: "Password changed. Sign in again.",
      });
    }),
  );
  app.post(
    "/user/logout",
    requireSession,
    asyncHandler(async (req, res) => {
      await Session.deleteOne({
        _id: req.session._id,
      });
      res.clearCookie("gatepilot_session", {
        ...getSessionCookieOptions(),
        maxAge: undefined,
      });
      res.json({
        message: "Signed out",
      });
    }),
  );
}
module.exports = { registerAuthenticationRoutes };
