const { verifyToken, roles } = require("../../middleware/authMiddleware");
const { getSettings, addOption, setOptionActive, saveSettings } = require("../settings");
const v = require("../validation");
const { wrap } = require("../http");

function registerSettingsRoutes(app) {
  app.get(
    "/settings",
    verifyToken,
    wrap(async (req, res) => res.json(await getSettings())),
  );
  app.put(
    "/settings/organization",
    roles("superadmin"),
    wrap(async (req, res) => {
      const settings = await getSettings();
      settings.name = v.text(req.body, "name", true, 80);
      res.json(await saveSettings(settings));
    }),
  );
  for (const kind of ["gates", "departments"]) {
    app.post(
      `/settings/${kind}`,
      roles("superadmin"),
      wrap(async (req, res) => {
        res.status(201).json(await addOption(kind, req.body));
      }),
    );
    app.put(
      `/settings/${kind}/:id`,
      roles("superadmin"),
      wrap(async (req, res) => {
        res.json(await setOptionActive(kind, req.params.id, req.body.active));
      }),
    );
  }
}
module.exports = { registerSettingsRoutes };
