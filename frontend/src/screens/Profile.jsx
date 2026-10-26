import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { api } from "../api";
import { Button, Field, Message, styles } from "../ui";
import { Heading } from "../components/ScreenElements";

export function Profile({ user, onUpdate, onPasswordChange }) {
  const [displayName, setDisplayName] = useState(user.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveProfile() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updatedUser = await api("/user/me", "PUT", { name: displayName });
      onUpdate(updatedUser);
      setMessage("Your profile has been updated.");
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function changePassword() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("/user/password", "POST", { currentPassword, newPassword });
      await onPasswordChange();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  const canChangePassword =
    currentPassword && newPassword.length >= 12 && newPassword === confirmPassword;

  return (
    <>
      <Heading title="My profile" subtitle="Make it yours. Keep your account protected." />
      <Message text={error} error />
      <Message text={message} />
      <View style={[styles.row, profileStyles.columns]}>
        <View style={[styles.card, profileStyles.panel]}>
          <Text style={styles.title}>Personal details</Text>
          <Text style={styles.muted}>
            {user.email} · {user.role}
          </Text>
          <Field label="Display name *" value={displayName} onChange={setDisplayName} />
          <Text style={styles.muted}>
            Your email, role, department and gate assignments are managed by organization
            administration.
          </Text>
          <Button
            title="Save profile"
            icon="check"
            busy={busy}
            disabled={!displayName.trim()}
            onPress={saveProfile}
          />
        </View>
        <View style={[styles.card, profileStyles.panel]}>
          <Text style={styles.title}>Change password</Text>
          <Text style={styles.muted}>
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
          <Field
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            password
          />
          <Button
            title="Update password & sign out"
            icon="lock"
            busy={busy}
            disabled={!canChangePassword}
            onPress={changePassword}
          />
        </View>
      </View>
    </>
  );
}

const profileStyles = StyleSheet.create({
  columns: { alignItems: "flex-start" },
  panel: { flex: 1, minWidth: 260 },
});
