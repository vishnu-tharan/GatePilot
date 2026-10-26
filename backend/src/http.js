const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  gate: u.gate,
  department: u.department,
  active: u.active !== false,
});
const scope = (req) =>
  req.user.role === "admin"
    ? {
        department: req.user.department || "__unassigned__",
      }
    : {};
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 8 * 60 * 60 * 1000,
});
module.exports = { wrap, publicUser, scope, cookieOptions };
