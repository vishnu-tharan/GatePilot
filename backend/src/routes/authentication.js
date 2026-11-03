const { User, Session } = require("../models");
const { requireSession, hashSessionToken } = require("../../middleware/authMiddleware");
const { randomBytes } = require("node:crypto");
const { asyncHandler, toPublicUser, getSessionCookieOptions } = require("../http");
const bcrypt = require("bcryptjs");
const validation = require("../validation");

function registerAuthenticationRoutes(app, { loginLimiter }) {
  // POST /user/login - User Sign In
  app.post(
    "/user/login",
    loginLimiter,
    asyncHandler(async (req, res) => {
      const email = validation.text(req.body, "email", true).toLowerCase();
      const password = validation.secret(req.body, "password");

      // Find user and include their hashed password
      const user = await User.findOne({ email }).select("+password");

      if (!user || !user.active) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      // Compare password with stored bcrypt hash
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      // Generate a clean session token
      const token = randomBytes(32).toString("hex");

      // Save session in database (8-hour expiration)
      await Session.create({
        tokenHash: hashSessionToken(token),
        userId: user._id,
        version: user.sessionVersion || 0,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      });

      // Set HTTP cookie for web browsers
      res.cookie("gatepilot_session", token, getSessionCookieOptions());

      // Return user info and token (token used by mobile / API clients)
      res.json({
        user: toPublicUser(user),
        ...(!req.headers.origin ? { token } : {}),
      });
    }),
  );

  // GET /user/me - Get Current Signed-in User
  app.get("/user/me", requireSession, (req, res) => {
    res.json(toPublicUser(req.user));
  });

  // PUT /user/me - Update My Profile Name
  app.put(
    "/user/me",
    requireSession,
    asyncHandler(async (req, res) => {
      const name = validation.text(req.body, "name", true);
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { name },
        { returnDocument: "after" },
      );
      res.json(toPublicUser(user));
    }),
  );

  // POST /user/password - Change My Password
  app.post(
    "/user/password",
    requireSession,
    asyncHandler(async (req, res) => {
      const user = await User.findById(req.user._id).select("+password");
      const currentPassword = validation.secret(req.body, "currentPassword");
      const newPassword = validation.password(req.body.newPassword);

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        validation.fail("Current password is incorrect.", 400);
      }
      if (currentPassword === newPassword) {
        validation.fail("New password must be different from current password.", 400);
      }

      // Hash new password and increment session version to invalidate all older sessions
      user.password = await bcrypt.hash(newPassword, 10);
      user.sessionVersion = (user.sessionVersion || 0) + 1;
      await user.save();

      // Clear existing session records
      await Session.deleteMany({ userId: user._id });
      res.clearCookie("gatepilot_session", getSessionCookieOptions());

      res.json({ message: "Password updated successfully. Please sign in again." });
    }),
  );

  // POST /user/logout - Sign Out
  app.post(
    "/user/logout",
    requireSession,
    asyncHandler(async (req, res) => {
      await Session.deleteOne({ _id: req.session._id });
      res.clearCookie("gatepilot_session", getSessionCookieOptions());
      res.json({ message: "Signed out successfully." });
    }),
  );
}

module.exports = { registerAuthenticationRoutes };
