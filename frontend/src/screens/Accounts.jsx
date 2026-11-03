import { useState } from "react";
import { Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { api } from "../api";
import { Button, Choices, Dialog, Field, Message, colors, styles } from "../ui";
import { useOrganization } from "../organization";
import { useLoad } from "../hooks/useLoad";
import { Heading, LoadState } from "../components/ScreenElements";

export function Accounts() {
  const { gates, departments } = useOrganization();
  const accountsState = useLoad("/user");
  const [form, setForm] = useState(null);
  const [accountToDisable, setAccountToDisable] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <>
      <Heading
        title="Staff & Gate Accounts"
        subtitle="Provision and manage security officers and department administrators."
        action={
          <Button
            title="Create Staff Account"
            icon="user-plus"
            onPress={() => {
              setError("");
              setForm({
                name: "",
                email: "",
                password: "",
                role: "security",
                gate: gates[0] || "Main Gate",
                department: departments[0] || "Operations",
              });
            }}
          />
        }
      />

      <LoadState state={accountsState} />

      <View style={[styles.card, { padding: 24, gap: 12 }]}>
        {accountsState.data?.map((person) => (
          <View
            key={person._id}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <View style={[styles.row, { gap: 12, alignItems: "center" }]}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: colors.softAccent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather
                  name={person.role === "security" ? "shield" : "user"}
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View style={{ gap: 2 }}>
                <Text style={{ fontWeight: "700", fontSize: 14, color: colors.ink }}>
                  {person.name}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {person.email} · Assigned:{" "}
                  <Text style={{ fontWeight: "600", color: colors.inkSecondary }}>
                    {person.gate || person.department || "Organization HQ"}
                  </Text>
                </Text>
              </View>
            </View>

            <View style={[styles.row, { gap: 8, alignItems: "center" }]}>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: "#ffffff",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.muted,
                    textTransform: "uppercase",
                  }}
                >
                  {person.role === "superadmin"
                    ? "Administrator"
                    : person.role === "admin"
                      ? "Dept Manager"
                      : "Security Officer"}
                </Text>
              </View>

              {person.role !== "superadmin" ? (
                <View style={[styles.row, { gap: 6 }]}>
                  <Button
                    title="Edit"
                    secondary
                    small
                    onPress={() => {
                      setForm({ ...person });
                      setError("");
                    }}
                  />
                  <Button
                    title="Disable"
                    danger
                    small
                    onPress={() => {
                      setAccountToDisable(person);
                      setError("");
                    }}
                  />
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {/* Create / Edit Account Modal */}
      {form && (
        <Dialog
          title={form._id ? "Edit Staff Account" : "Provision New Account"}
          onClose={() => !busy && setForm(null)}
        >
          <Message text={error} error />

          <Field
            label="Full Name *"
            value={form.name}
            onChange={(val) => setForm({ ...form, name: val })}
            placeholder="e.g. Officer John Doe"
          />

          {!form._id && (
            <>
              <Field
                label="Email Address *"
                value={form.email}
                keyboardType="email-address"
                onChange={(val) => setForm({ ...form, email: val })}
                placeholder="officer@campus.test"
              />
              <Field
                label="Initial Password *"
                value={form.password}
                password
                onChange={(val) => setForm({ ...form, password: val })}
                placeholder="Minimum 6 characters"
              />
              <Choices
                label="Assigned System Role *"
                options={["security", "admin"]}
                value={form.role}
                onChange={(val) => setForm({ ...form, role: val })}
              />
            </>
          )}

          {form.role === "security" ? (
            <Choices
              label="Assigned Gate Checkpoint"
              options={gates.length ? gates : ["North Gate", "East Gate", "West Gate"]}
              value={form.gate}
              onChange={(val) => setForm({ ...form, gate: val })}
            />
          ) : (
            <Choices
              label="Assigned Department"
              options={departments.length ? departments : ["Operations", "Engineering"]}
              value={form.department}
              onChange={(val) => setForm({ ...form, department: val })}
            />
          )}

          <Button
            title="Save Staff Account"
            icon="check"
            busy={busy}
            disabled={!form.name?.trim() || (!form._id && (!form.email?.trim() || !form.password))}
            onPress={async () => {
              setBusy(true);
              setError("");
              try {
                await api(
                  form._id ? `/user/${form._id}` : "/user",
                  form._id ? "PUT" : "POST",
                  form,
                );
                setForm(null);
                await accountsState.reload();
              } catch (e) {
                setError(e.message || "Failed to save account.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </Dialog>
      )}

      {/* Disable Confirmation Modal */}
      {accountToDisable && (
        <Dialog title="Disable Staff Account?" onClose={() => !busy && setAccountToDisable(null)}>
          <Text style={[styles.text, { lineHeight: 22 }]}>
            Are you sure you want to disable{" "}
            <Text style={{ fontWeight: "700" }}>{accountToDisable.name}</Text>? They will
            immediately lose access to all gate terminals and active sessions will be terminated.
          </Text>
          <Message text={error} error />
          <Button
            title="Confirm Deactivation"
            icon="user-x"
            danger
            busy={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await api(`/user/${accountToDisable._id}`, "DELETE");
                setAccountToDisable(null);
                await accountsState.reload();
              } catch (e) {
                setError(e.message || "Failed to disable account.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </Dialog>
      )}
    </>
  );
}
