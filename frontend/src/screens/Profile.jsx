import { useState } from "react";
import { Text, View } from "react-native";
import { api } from "../api";
import { Button, Field, Message, s } from "../ui";
import { Heading } from "../components/ScreenElements";
export function Profile({ user, onUpdate, onPasswordChange }) {
  const [form, setForm] = useState({
      name: user.name,
    }),
    [currentPassword, setCurrentPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function run(fn) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading title="My profile" subtitle="Make it yours. Keep your account protected." />
      <Message text={error} error />
      <Message text={message} />
      <View
        style={[
          s.row,
          {
            alignItems: "flex-start",
          },
        ]}
      >
        <View
          style={[
            s.card,
            {
              flex: 1,
              minWidth: 260,
            },
          ]}
        >
          <Text style={s.title}>Personal details</Text>
          <Text style={s.muted}>
            {user.email} · {user.role}
          </Text>
          <Field
            label="Display name *"
            value={form.name}
            onChange={(value) =>
              setForm({
                ...form,
                name: value,
              })
            }
          />
          <Text style={s.muted}>
            Your email, role, department and gate assignments are managed by organization
            administration.
          </Text>
          <Button
            title="Save profile"
            icon="check"
            busy={busy}
            disabled={!form.name.trim()}
            onPress={() =>
              run(async () => {
                const updated = await api("/user/me", "PUT", form);
                onUpdate(updated);
                setMessage("Your profile has been updated.");
              })
            }
          />
        </View>
        <View
          style={[
            s.card,
            {
              flex: 1,
              minWidth: 260,
            },
          ]}
        >
          <Text style={s.title}>Change password</Text>
          <Text style={s.muted}>
            Use 12+ characters with uppercase, lowercase and a number. Changing your password signs
            out every session.
          </Text>
          <Field
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            password
          />
          <Field label="New password" value={newPassword} onChange={setNewPassword} password />
          <Field label="Confirm new password" value={confirm} onChange={setConfirm} password />
          <Button
            title="Update password & sign out"
            icon="lock"
            busy={busy}
            disabled={!currentPassword || newPassword.length < 12 || newPassword !== confirm}
            onPress={() =>
              run(async () => {
                await api("/user/password", "POST", {
                  currentPassword,
                  newPassword,
                });
                await onPasswordChange();
              })
            }
          />
        </View>
      </View>
    </>
  );
}
