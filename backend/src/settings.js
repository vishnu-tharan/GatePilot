const { OrganizationSettings, User, VehicleRecord } = require("./models");
const v = require("./validation");

const defaults = {
  name: "Sample Campus",
  gates: ["North Gate", "East Gate", "West Gate"].map((name) => ({ name, active: true })),
  departments: ["Operations", "Engineering", "Administration", "Other"].map((name) => ({
    name,
    active: true,
  })),
};

async function getSettings() {
  await OrganizationSettings.init();
  const existing = await OrganizationSettings.findOne({ key: "organization" });
  if (existing) return existing;
  try {
    return await OrganizationSettings.findOneAndUpdate(
      { key: "organization" },
      { $setOnInsert: defaults },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    return OrganizationSettings.findOne({ key: "organization" });
  }
}

function activeNames(settings, kind) {
  return settings[kind].filter((item) => item.active).map((item) => item.name);
}

async function saveSettings(settings) {
  try {
    return await settings.save();
  } catch (error) {
    if (error.name === "VersionError")
      v.fail("Settings changed in another session. Refresh and try again.", 409);
    throw error;
  }
}

async function addOption(kind, body) {
  const name = v.text(body, "name", true, 60).replace(/\s+/g, " ");
  if (name.length < 2) v.fail("Use a name with at least two characters");
  const settings = await getSettings();
  if (settings[kind].some((item) => item.name.toLowerCase() === name.toLowerCase())) {
    v.fail("This name already exists. Reactivate the existing option if needed.", 409);
  }
  if (settings[kind].length >= 1000) v.fail("This organization has reached the 1,000-option limit");
  settings[kind].push({ name, active: true });
  return saveSettings(settings);
}

async function setOptionActive(kind, id, active) {
  if (typeof active !== "boolean") v.fail("Invalid active status");
  const settings = await getSettings();
  const item = settings[kind].id(id);
  if (!item) v.fail("Setting not found", 404);
  if (item.active === active) return settings;
  if (!active) {
    if (activeNames(settings, kind).length <= 1) v.fail("Keep at least one active option", 409);
    const assignment =
      kind === "gates"
        ? { gate: item.name, role: "security" }
        : { department: item.name, role: "admin" };
    if (await User.exists({ ...assignment, active: { $ne: false } })) {
      v.fail("Reassign or disable the accounts using this option before retiring it", 409);
    }
    if (
      kind === "departments" &&
      (await VehicleRecord.exists({ department: item.name, outTime: null }))
    )
      v.fail("Close open visits before retiring this department", 409);
  }
  item.active = active;
  return saveSettings(settings);
}

module.exports = { getSettings, activeNames, addOption, setOptionActive, saveSettings };
