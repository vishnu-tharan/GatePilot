const { requireSession, allowRoles } = require("../../middleware/authMiddleware");
const { getSettings, addOption, setOptionActive, saveSettings } = require("../settings");
const validation = require("../validation");
const { asyncHandler } = require("../http");

function registerSettingsRoutes(app) {
  app.get(
    "/settings",
    requireSession,
    asyncHandler(async (req, res) => res.json(await getSettings())),
  );
  app.put(
    "/settings/organization",
    allowRoles("superadmin"),
    asyncHandler(async (req, res) => {
      const settings = await getSettings();
      settings.name = validation.text(req.body, "name", true, 80);
      res.json(await saveSettings(settings));
    }),
  );
  for (const kind of ["gates", "departments"]) {
    app.post(
      `/settings/${kind}`,
      allowRoles("superadmin"),
      asyncHandler(async (req, res) => {
        res.status(201).json(await addOption(kind, req.body));
      }),
    );
    app.put(
      `/settings/${kind}/:id`,
      allowRoles("superadmin"),
      asyncHandler(async (req, res) => {
        res.json(await setOptionActive(kind, req.params.id, req.body.active));
      }),
    );
  }
}
module.exports = { registerSettingsRoutes };
