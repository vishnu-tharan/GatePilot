import { useState } from "react";
import {
  Platform,
  Text,
  View,
  useWindowDimensions,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { api, saveToken } from "../api";
import { Button, Field, Message, colors, styles } from "../ui";
import { branding } from "../branding.mjs";
import { BrandMark } from "../brand";
import { useLoad } from "../hooks/useLoad";

export function Login({ onLogin }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const organization = useLoad("/workspace");
  const organizationName = organization.data?.name || branding.defaultOrganization;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    setError("");
    try {
      const data = await api("/user/login", "POST", { email, password });
      await saveToken(data.token);
      onLogin(data.user);
    } catch (e) {
      setError(e.message || "Invalid credentials. Please verify and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.sidebarBg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          flexDirection: wide ? "row" : "column",
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Left Presentation Hero (Desktop Only) */}
        {wide ? (
          <View
            style={{
              flex: 1.1,
              backgroundColor: "#070b14",
              borderRightWidth: 1,
              borderRightColor: "#1e293b",
              padding: 56,
              justifyContent: "space-between",
            }}
          >
            {/* Top Brand */}
            <View style={[styles.row, { gap: 12, alignItems: "center" }]}>
              <BrandMark size={40} />
              <View>
                <Text
                  style={{ color: "#ffffff", fontSize: 18, fontWeight: "800", letterSpacing: 0.5 }}
                >
                  GATEPILOT
                </Text>
                <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>
                  ENTERPRISE ACCESS OS
                </Text>
              </View>
            </View>

            {/* Middle Value Proposition */}
            <View style={{ gap: 24, maxWidth: 480 }}>
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <View
                  style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#60a5fa" }}
                />
                <Text
                  style={{ color: "#93c5fd", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}
                >
                  CAMPUS GATE SYSTEM
                </Text>
              </View>

              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 42,
                  fontWeight: "800",
                  letterSpacing: -1.5,
                  lineHeight: 48,
                }}
              >
                Intelligent vehicle & equipment tracking.
              </Text>

              <Text style={{ color: "#94a3b8", fontSize: 15, lineHeight: 24 }}>
                Instant vehicle verification, automated department equipment approvals, and
                tamper-proof departure logging for modern campuses.
              </Text>

              {/* Feature Highlights */}
              <View style={{ gap: 14, paddingTop: 12 }}>
                {[
                  ["shield", "Secure, role-based gate and manager workflows"],
                  ["check-circle", "Equipment approvals prevent unauthorized departures"],
                  ["zap", "Real-time sync across multi-gate checkpoints"],
                ].map(([icon, text]) => (
                  <View key={text} style={[styles.row, { gap: 10, alignItems: "center" }]}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather name={icon} size={14} color="#60a5fa" />
                    </View>
                    <Text style={{ color: "#cbd5e1", fontSize: 13, fontWeight: "500" }}>
                      {text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bottom Facility Tag */}
            <Text style={{ color: "#475569", fontSize: 12 }}>
              Dedicated Terminal for <Text style={{ color: "#94a3b8" }}>{organizationName}</Text>
            </Text>
          </View>
        ) : null}

        {/* Right Authentication Form */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#f8fafc",
            alignItems: "center",
            justifyContent: "center",
            padding: wide ? 48 : 24,
            minHeight: wide ? "100%" : 600,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              backgroundColor: "#ffffff",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              padding: wide ? 36 : 24,
              gap: 20,
              shadowColor: "#0f172a",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            {/* Header */}
            <View style={{ gap: 6 }}>
              {!wide ? (
                <View style={[styles.row, { gap: 8, alignItems: "center", marginBottom: 8 }]}>
                  <BrandMark size={32} />
                  <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>
                    GATEPILOT
                  </Text>
                </View>
              ) : null}
              <Text
                style={{ fontSize: 24, fontWeight: "800", color: colors.ink, letterSpacing: -0.6 }}
              >
                Sign in to Terminal
              </Text>
              <Text style={styles.muted}>
                Enter your credentials or choose a quick test account below.
              </Text>
            </View>

            {/* Quick One-Click Demo Role Selectors */}
            <View style={{ gap: 8 }}>
              <Text style={styles.sectionTitle}>Quick Test Accounts</Text>
              <View style={[styles.row, { gap: 6 }]}>
                {[
                  ["Security Guard", "officer@preview.test"],
                  ["Dept Manager", "manager@preview.test"],
                  ["Admin", "admin@preview.test"],
                ].map(([label, demoEmail]) => (
                  <Pressable
                    key={demoEmail}
                    onPress={() => {
                      setEmail(demoEmail);
                      setPassword("password123");
                    }}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 8,
                        borderRadius: 8,
                        backgroundColor: email === demoEmail ? colors.softAccent : "#f1f5f9",
                        borderWidth: 1,
                        borderColor: email === demoEmail ? colors.primary : colors.border,
                        alignItems: "center",
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: email === demoEmail ? colors.primary : colors.inkSecondary,
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            {/* Inputs */}
            <Field
              label="Email Address"
              value={email}
              onChange={setEmail}
              keyboardType="email-address"
              placeholder="officer@preview.test"
            />

            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              password
              placeholder="••••••••"
            />

            <Message text={error} error />

            {/* Sign In Button */}
            <Button
              title="Authenticate & Enter"
              icon="arrow-right"
              busy={busy}
              disabled={!email.trim() || !password}
              onPress={login}
            />

            <View style={[styles.row, { justifyContent: "center", gap: 6, marginTop: 4 }]}>
              <Feather name="lock" size={12} color={colors.mutedLight} />
              <Text style={{ fontSize: 11, color: colors.mutedLight, fontWeight: "500" }}>
                Encrypted Session · Session expires in 8 hours
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
