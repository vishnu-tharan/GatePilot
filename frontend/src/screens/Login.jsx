import { useState } from "react";
import {
  Platform,
  Text,
  View,
  useWindowDimensions,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { api, saveToken } from "../api";
import { Button, Field, Message, colors, s } from "../ui";
import { branding } from "../branding.mjs";
import { BrandMark, PrototypeNotice } from "../brand";
import { useLoad } from "../hooks/useLoad";
export function Login({ onLogin }) {
  const { width } = useWindowDimensions();
  const organization = useLoad("/workspace");
  const organizationName = organization.data?.name || branding.defaultOrganization;
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function login() {
    setBusy(true);
    setError("");
    try {
      const data = await api("/user/login", "POST", {
        email,
        password,
      });
      await saveToken(data.token);
      onLogin(data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          flexDirection: width > 900 ? "row" : "column",
          backgroundColor: "#f3f5fb",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#17243a",
            padding: width > 900 ? 64 : 30,
            justifyContent: "space-between",
            minHeight: width > 900 ? 680 : 270,
          }}
        >
          <View style={s.row}>
            <BrandMark size={56} />
            <View>
              <Text
                style={{
                  color: "white",
                  fontSize: 22,
                  fontWeight: "700",
                  letterSpacing: 2,
                }}
              >
                GATEPILOT
              </Text>
              <Text
                style={{
                  color: "#c4cee3",
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {organizationName.toUpperCase()}
              </Text>
            </View>
          </View>
          <View
            style={{
              gap: 22,
              marginVertical: 38,
            }}
          >
            <Text
              style={{
                color: "#9ef0d3",
                fontSize: 12,
                fontWeight: "700",
                letterSpacing: 2,
              }}
            >
              ORGANIZATION ACCESS, SIMPLIFIED.
            </Text>
            <Text
              style={{
                color: "white",
                fontSize: width > 900 ? 56 : 34,
                fontWeight: "700",
                letterSpacing: -2,
                maxWidth: 540,
              }}
            >
              Keep arrivals moving.{"\n"}Keep access clear.
            </Text>
            <Text
              style={{
                color: "#c4cee3",
                fontSize: 16,
                lineHeight: 26,
                maxWidth: 420,
              }}
            >
              Arrivals, equipment reviews, and departures. One connected workspace for the people at
              every gate.
            </Text>
          </View>
          {width > 900 && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#344565",
                paddingTop: 26,
                gap: 18,
              }}
            >
              {[
                ["log-in", "Record arrivals with confidence."],
                ["check-circle", "Review equipment before departure."],
                ["smartphone", "A shared workspace on any screen."],
              ].map(([icon, label]) => (
                <View key={label} style={s.row}>
                  <Feather name={icon} size={18} color="#9ef0d3" />
                  <Text
                    style={{
                      color: "#e2e8f5",
                      fontSize: 14,
                    }}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 30,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 440,
              gap: 22,
              padding: 28,
              borderRadius: 24,
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                backgroundColor: colors.softAccent,
                padding: 15,
                borderRadius: 16,
                alignSelf: "flex-start",
              }}
            >
              <Feather name="lock" size={25} color={colors.primary} />
            </View>
            <View
              style={{
                gap: 10,
              }}
            >
              <Text
                style={{
                  color: colors.ink,
                  fontSize: 32,
                  fontWeight: "700",
                  letterSpacing: -1,
                }}
              >
                Open your workspace
              </Text>
              <Text style={s.muted}>Sign in to explore your access-management workspace.</Text>
            </View>
            <PrototypeNotice />
            <View
              style={{
                gap: 9,
              }}
            >
              <Text style={s.label}>Choose a demo workspace</Text>
              <View
                style={[
                  s.row,
                  {
                    gap: 8,
                  },
                ]}
              >
                {[
                  ["Workspace admin", "admin@preview.test"],
                  ["Department admin", "manager@preview.test"],
                  ["Gate officer", "officer@preview.test"],
                ].map(([label, account]) => (
                  <Button
                    key={account}
                    title={label}
                    secondary
                    small
                    onPress={() => setEmail(account)}
                  />
                ))}
              </View>
            </View>
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              keyboardType="email-address"
              placeholder="admin@preview.test"
            />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              password
              placeholder="Enter your password"
            />
            <Message text={error} error />
            <Button
              title="Sign in to GatePilot"
              icon="arrow-right"
              busy={busy}
              disabled={!email.trim() || !password}
              onPress={login}
            />
            <Text
              style={[
                s.muted,
                {
                  textAlign: "center",
                  fontSize: 12,
                },
              ]}
            >
              Use a demo account to explore arrivals and departures with fictional visitor details.
            </Text>
            <View style={s.divider} />
            <Text
              style={[
                s.muted,
                {
                  fontSize: 11,
                  textAlign: "center",
                },
              ]}
            >
              Prototype workspace · Sessions expire after 8 hours
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
