const { createHash } = require("node:crypto");
const { Session, User } = require("../src/models");

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function readSessionToken(req) {
  const authorization = req.headers.authorization || "";
  const bearerToken = authorization.match(/^Bearer ([a-f0-9]{64})$/);
  if (bearerToken) return bearerToken[1];

  const cookies = (req.headers.cookie || "").split(";");
  const sessionCookie = cookies
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("gatepilot_session="));
  if (!sessionCookie) return null;
  return sessionCookie.slice("gatepilot_session=".length);
}

async function requireSession(req, res, next) {
  try {
    const token = readSessionToken(req);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(401).json({ message: "Please sign in" });
    }

    const session = await Session.findOne({
      tokenHash: hashSessionToken(token),
      expiresAt: { $gt: new Date() },
    });
    if (!session) {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }

    const user = await User.findById(session.userId);
    if (!user || user.active === false || (user.sessionVersion || 0) !== session.version) {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
}

function allowRoles(...allowedRoles) {
  function checkRole(req, res, next) {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission for this action" });
    }
    next();
  }
  return [requireSession, checkRole];
}

module.exports = { hashSessionToken, requireSession, allowRoles };
