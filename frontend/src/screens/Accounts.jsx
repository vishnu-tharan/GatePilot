import { useState } from "react";
import { Text, View } from "react-native";
import { api } from "../api";
import { Button, Choices, Dialog, Field, Message, colors, s } from "../ui";
import { useOrganization } from "../organization";
import { useLoad } from "../hooks/useLoad";
import { Heading, LoadState } from "../components/ScreenElements";
export function Accounts() {
  const { gates, departments } = useOrganization();

  const state = useLoad("/user");
  const [form, setForm] = useState(null),
    [disable, setDisable] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <Heading
        title="Manage accounts"
        subtitle="Assign security officers and department administrators."
        action={
          <Button
            title="Create account"
            icon="user-plus"
            onPress={() => {
              setError("");
              setForm({
                name: "",
                email: "",
                password: "",
                role: "security",
                gate: gates[0],
                department: departments[0] || "",
              });
            }}
          />
        }
      />
      <LoadState state={state} />
      <View style={s.card}>
        {state.data?.map((person) => (
          <View
            key={person._id}
            style={{
              gap: 12,
              paddingVertical: 17,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={[
                s.row,
                {
                  justifyContent: "space-between",
                },
              ]}
            >
              <View>
                <Text
                  style={[
                    s.text,
                    {
                      fontWeight: "700",
                    },
                  ]}
                >
                  {person.name}
                </Text>
                <Text style={s.muted}>{person.email}</Text>
                <Text style={s.muted}>
                  {person.role} · {person.gate || person.department || "All departments"}
                </Text>
              </View>
              {person.role !== "superadmin" && (
                <View style={s.row}>
                  <Button
                    title="Edit"
                    secondary
                    small
                    onPress={() => {
                      setForm({
                        ...person,
                      });
                      setError("");
                    }}
                  />
                  <Button
                    title="Disable"
                    danger
                    small
                    onPress={() => {
                      setDisable(person);
                      setError("");
                    }}
                  />
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
      {form && (
        <Dialog
          title={form._id ? "Edit account" : "Create account"}
          onClose={() => !busy && setForm(null)}
        >
          <Message text={error} error />
          <Field
            label="Full name *"
            value={form.name}
            onChange={(value) =>
              setForm({
                ...form,
                name: value,
              })
            }
          />
          {!form._id && (
            <>
              <Field
                label="Email address *"
                value={form.email}
                keyboardType="email-address"
                onChange={(value) =>
                  setForm({
                    ...form,
                    email: value,
                  })
                }
              />
              <Field
                label="Initial password *"
                value={form.password}
                password
                onChange={(value) =>
                  setForm({
                    ...form,
                    password: value,
                  })
                }
              />
              <Text style={s.muted}>
                At least 12 characters, with uppercase, lowercase and a number. Share through an
                approved private channel.
              </Text>
              <Choices
                label="Role"
                options={["security", "admin"]}
                value={form.role}
                onChange={(value) =>
                  setForm({
                    ...form,
                    role: value,
                  })
                }
              />
            </>
          )}
          {form.role === "security" ? (
            <Choices
              label="Assigned gate"
              options={gates}
              value={form.gate}
              onChange={(value) =>
                setForm({
                  ...form,
                  gate: value,
                })
              }
            />
          ) : (
            <Choices
              label="Assigned department"
              options={departments}
              value={form.department}
              onChange={(value) =>
                setForm({
                  ...form,
                  department: value,
                })
              }
            />
          )}
          <Button
            title="Save account"
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
                await state.reload();
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </Dialog>
      )}
      {disable && (
        <Dialog title="Disable account?" onClose={() => !busy && setDisable(null)}>
          <Text style={s.text}>
            {disable.name} will immediately lose access, including on devices already signed in.
            Existing records remain available.
          </Text>
          <Message text={error} error />
          <Button
            title="Confirm disable"
            danger
            busy={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await api(`/user/${disable._id}`, "DELETE");
                setDisable(null);
                await state.reload();
              } catch (e) {
                setError(e.message);
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
