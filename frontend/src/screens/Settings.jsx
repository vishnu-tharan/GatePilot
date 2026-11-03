import { useState } from "react";
import { Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { api } from "../api";
import { useOrganization } from "../organization";
import { Button, Dialog, Field, Message, styles, colors } from "../ui";
import { Heading } from "../components/ScreenElements";

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
      <Heading
        title="Facility & Campus Settings"
        subtitle="Manage organization identity, gate checkpoints, and registered departments."
      />

      <Message text={error} error />
      <Message text={message} />

      {/* Campus Identity Card */}
      <View style={[styles.card, { padding: 26, gap: 16 }]}>
        <Text style={styles.title}>Campus Identity</Text>
        <Text style={styles.muted}>
          The organization name appears across all gate terminal headers and printed gate passes.
        </Text>
        <Field label="Organization / Campus Name" value={name} onChange={setName} />
        <Button
          title="Save Organization Name"
          icon="check"
          busy={busy}
          disabled={!name.trim()}
          onPress={() =>
            change("/settings/organization", "PUT", { name }, "Organization name updated.")
          }
        />
      </View>

      {/* Gates & Departments Sections */}
      {["gates", "departments"].map((kind) => {
        const isGate = kind === "gates";
        return (
          <View key={kind} style={[styles.card, { padding: 26, gap: 18 }]}>
            <View style={[styles.row, { gap: 10, alignItems: "center" }]}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.softAccent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name={isGate ? "map-pin" : "briefcase"} size={16} color={colors.primary} />
              </View>
              <Text style={styles.title}>
                {isGate ? "Active Gate Checkpoints" : "Registered Departments"}
              </Text>
            </View>

            <Text style={styles.muted}>
              {isGate
                ? "Physical checkpoints where security officers are assigned to log vehicle arrivals and verify departures."
                : "Departments where visitors deliver carried equipment. Managers in these departments review entry requests."}
            </Text>

            {/* Add New Option Input */}
            <View style={[styles.row, { gap: 10 }]}>
              <View style={{ flex: 1, minWidth: 240 }}>
                <Field
                  label=""
                  placeholder={
                    isGate
                      ? "New gate name (e.g. South Gate)"
                      : "New department name (e.g. Facilities)"
                  }
                  value={draft[kind]}
                  onChange={(val) => setDraft((old) => ({ ...old, [kind]: val }))}
                />
              </View>
              <Button
                title={isGate ? "Add Checkpoint" : "Add Department"}
                icon="plus"
                busy={busy}
                disabled={draft[kind].trim().length < 2}
                onPress={async () => {
                  if (
                    await change(
                      `/settings/${kind}`,
                      "POST",
                      { name: draft[kind] },
                      "Option added successfully.",
                    )
                  )
                    setDraft((old) => ({ ...old, [kind]: "" }));
                }}
              />
            </View>

            {/* List of Existing Options */}
            <View style={{ gap: 8, marginTop: 4 }}>
              {settings[kind].map((item) => (
                <View
                  key={item._id}
                  style={[
                    styles.row,
                    {
                      justifyContent: "space-between",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      backgroundColor: "#f8fafc",
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.row, { gap: 8, alignItems: "center" }]}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: item.active ? colors.green : colors.muted,
                      }}
                    />
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      ({item.active ? "Active" : "Retired"})
                    </Text>
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
          </View>
        );
      })}

      {/* Retire Confirmation Modal */}
      {retire && (
        <Dialog title={`Retire ${retire.item.name}?`} onClose={() => !busy && setRetire(null)}>
          <Text style={[styles.text, { lineHeight: 22 }]}>
            Retiring <Text style={{ fontWeight: "700" }}>{retire.item.name}</Text> will prevent new
            vehicle entries or staff assignments from selecting it. Historical records will be
            preserved.
          </Text>
          <Message text={error} error />
          <Button
            title="Confirm Retirement"
            danger
            busy={busy}
            onPress={() =>
              change(
                `/settings/${retire.kind}/${retire.item._id}`,
                "PUT",
                { active: false },
                "Option retired. Historical records remain intact.",
              )
            }
          />
        </Dialog>
      )}
    </>
  );
}
