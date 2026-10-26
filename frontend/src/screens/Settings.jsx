import { useState } from "react";
import { Text, View } from "react-native";
import { api } from "../api";
import { useOrganization } from "../organization";
import { Button, Dialog, Field, Message, styles } from "../ui";

export function SettingsScreen() {
  const { settings, refresh } = useOrganization();
  const [name, setName] = useState(settings.name);
  const [draft, setDraft] = useState({ gates: "", departments: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retire, setRetire] = useState(null);
  async function change(path, method, body, success) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(path, method, body);
      await refresh();
      setMessage(success);
      setRetire(null);
      return true;
    } catch (problem) {
      setError(problem.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <View style={{ gap: 8 }}>
        <Text style={styles.title}>Organization settings</Text>
        <Text style={styles.muted}>
          Adapt GatePilot to a campus, office, factory, or other workplace.
        </Text>
      </View>
      <Message text={error} error />
      <Message text={message} />
      <View style={styles.card}>
        <Text style={styles.title}>Workspace identity</Text>
        <Field label="Organization name" value={name} onChange={setName} />
        <Text style={styles.muted}>
          For a public demonstration, use a fictional organization and synthetic records.
        </Text>
        <Button
          title="Save organization name"
          busy={busy}
          disabled={!name.trim()}
          onPress={() =>
            change("/settings/organization", "PUT", { name }, "Organization name updated.")
          }
        />
      </View>
      {["gates", "departments"].map((kind) => (
        <View key={kind} style={styles.card}>
          <Text style={styles.title}>
            {kind === "gates" ? "Gates & entry points" : "Departments & teams"}
          </Text>
          <Text style={styles.muted}>
            Add options as your organization grows. Retired options remain in historical records and
            can be reactivated.
          </Text>
          <Field
            label={kind === "gates" ? "New gate name" : "New department name"}
            value={draft[kind]}
            onChange={(value) => setDraft((old) => ({ ...old, [kind]: value }))}
          />
          <Button
            title={kind === "gates" ? "Add gate" : "Add department"}
            busy={busy}
            disabled={draft[kind].trim().length < 2}
            onPress={async () => {
              if (
                await change(
                  `/settings/${kind}`,
                  "POST",
                  { name: draft[kind] },
                  "Option added. Forms and filters are updated.",
                )
              )
                setDraft((old) => ({ ...old, [kind]: "" }));
            }}
          />
          {settings[kind].map((item) => (
            <View
              key={item._id}
              style={[styles.row, { justifyContent: "space-between", paddingVertical: 10 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.text}>{item.name}</Text>
                <Text style={styles.muted}>{item.active ? "Active" : "Retired"}</Text>
              </View>
              <Button
                title={item.active ? "Retire" : "Reactivate"}
                secondary
                small
                busy={busy}
                onPress={() =>
                  item.active
                    ? setRetire({ kind, item })
                    : change(
                        `/settings/${kind}/${item._id}`,
                        "PUT",
                        { active: true },
                        "Option reactivated.",
                      )
                }
              />
            </View>
          ))}
        </View>
      ))}
      {retire && (
        <Dialog title={`Retire ${retire.item.name}?`} onClose={() => !busy && setRetire(null)}>
          <Text style={styles.text}>
            This option will stop appearing in new assignments and entries. Historical records
            remain unchanged. Reassign linked accounts first; departments also need their open
            visits closed.
          </Text>
          <Message text={error} error />
          <Button
            title="Confirm retirement"
            danger
            busy={busy}
            onPress={() =>
              change(
                `/settings/${retire.kind}/${retire.item._id}`,
                "PUT",
                { active: false },
                "Option retired. Historical records are preserved.",
              )
            }
          />
        </Dialog>
      )}
    </>
  );
}
