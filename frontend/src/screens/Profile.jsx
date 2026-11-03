import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { api } from "../api";
import { Button, Field, Message, styles, colors } from "../ui";
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
      setMessage("Your display name has been updated.");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
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
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setBusy(false);
    }
  }

  const canChangePassword =
    currentPassword && newPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <>
      <Heading
        title="Account & Security"
        subtitle="Manage your personal staff details and update terminal password."
      />

      <Message text={error} error />
      <Message text={message} />

      <View style={[styles.row, profileStyles.columns]}>
        {/* Personal Details Card */}
        <View style={[styles.card, profileStyles.panel, { padding: 26, gap: 16 }]}>
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
              <Feather name="user" size={16} color={colors.primary} />
            </View>
            <Text style={styles.title}>Staff Details</Text>
          </View>

          <View
            style={{
              gap: 4,
              backgroundColor: "#f8fafc",
              padding: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink }}>{user.email}</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              Role:{" "}
              <Text style={{ fontWeight: "600", color: colors.primary }}>
                {user.role?.toUpperCase()}
              </Text>{" "}
              · Assigned: {user.gate || user.department || "Organization HQ"}
            </Text>
          </View>

          <Field label="Display Name *" value={displayName} onChange={setDisplayName} />

          <Text style={[styles.muted, { fontSize: 12 }]}>
            Your email address and checkpoint/department assignments are managed by your campus
            administrator.
          </Text>

          <Button
            title="Save Profile"
            icon="check"
            busy={busy}
            disabled={!displayName.trim()}
            onPress={saveProfile}
          />
        </View>

        {/* Change Password Card */}
        <View style={[styles.card, profileStyles.panel, { padding: 26, gap: 16 }]}>
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
              <Feather name="lock" size={16} color={colors.primary} />
            </View>
            <Text style={styles.title}>Change Password</Text>
          </View>

          <Text style={styles.muted}>
            Enter at least 6 characters. Updating your password will sign out your other active
            sessions for security.
          </Text>

          <Field
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            password
            placeholder="Current password"
          />
          <Field
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            password
            placeholder="At least 6 characters"
          />
          <Field
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            password
            placeholder="Re-type new password"
          />

          <Button
            title="Update Password"
            icon="key"
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
  columns: { alignItems: "flex-start", gap: 20 },
  panel: { flex: 1, minWidth: 300 },
});
