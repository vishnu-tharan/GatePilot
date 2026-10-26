function asyncHandler(handler) {
  return async function handleRequest(req, res, next) {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function toPublicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    gate: user.gate,
    department: user.department,
    active: user.active !== false,
  };
}

function getDepartmentFilter(req) {
  if (req.user.role === "admin") {
    return { department: req.user.department || "__unassigned__" };
  }
  return {};
}

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  };
}

module.exports = { asyncHandler, toPublicUser, getDepartmentFilter, getSessionCookieOptions };
