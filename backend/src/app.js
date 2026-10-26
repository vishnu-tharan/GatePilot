const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { mongoose } = require("./models");
const { wrap } = require("./http");
const { getSettings, activeNames } = require("./settings");
const { registerSettingsRoutes } = require("./routes/settings");
const { registerAuthenticationRoutes } = require("./routes/authentication");
const { registerAccountsRoutes } = require("./routes/accounts");
const { registerVisitsRoutes } = require("./routes/visits");
const { registerDashboardRoutes } = require("./routes/dashboard");
function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
  app.use(helmet());
  const origins = (process.env.WEB_ORIGINS || "http://localhost:8081,http://localhost:5173")
    .split(",")
    .map((s) => s.trim());
  app.use((req, res, next) => {
    if (req.headers.origin && !origins.includes(req.headers.origin))
      return res.status(403).json({
        message: "Origin not allowed",
      });
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers["x-gatepilot-client"] !== "gatepilot"
    )
      return res.status(403).json({
        message: "Missing request protection header",
      });
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(
    cors({
      origin: origins,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-GatePilot-Client"],
    }),
  );
  app.use(
    express.json({
      limit: "32kb",
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 240,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        message: "Too many requests. Please wait a minute.",
      },
    }),
  );
  app.get("/health", (req, res) =>
    res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
      status: mongoose.connection.readyState === 1 ? "ready" : "unavailable",
    }),
  );
  app.use(
    wrap(async (req, res, next) => {
      req.settings = await getSettings();
      req.gates = activeNames(req.settings, "gates");
      req.departments = activeNames(req.settings, "departments");
      next();
    }),
  );
  app.get(
    "/workspace",
    wrap(async (req, res) =>
      res.json({
        name: req.settings.name,
      }),
    ),
  );
  registerSettingsRoutes(app);
  const loginLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 20,
    skipSuccessfulRequests: true,
    message: {
      message: "Too many sign-in attempts. Try again in 15 minutes.",
    },
  });
  registerAuthenticationRoutes(app, {
    loginLimiter,
  });
  registerAccountsRoutes(app);
  registerVisitsRoutes(app);
  registerDashboardRoutes(app);
  app.use((req, res) =>
    res.status(404).json({
      message: "Endpoint not found",
    }),
  );
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status =
      error.code === 11000 ? 409 : error.status || (error.name === "ValidationError" ? 400 : 500);
    res.status(status).json({
      message:
        error.code === 11000
          ? "An account or active vehicle visit already exists."
          : status >= 500
            ? "Service unavailable. Please try again."
            : error.message,
    });
  });
  return app;
}
module.exports = { createApp };
