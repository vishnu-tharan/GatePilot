import {
  ActivityIndicator,
  Text,
  View,
  useWindowDimensions,
  Pressable,
  ScrollView,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { saveToken } from "./api";
import { Button, Message, colors, s } from "./ui";
import { useOrganization } from "./organization";
import { BrandMark, PrototypeNotice } from "./brand";
import { SettingsScreen } from "./screens/Settings";
import { Dashboard } from "./screens/Dashboard";
import { Entry } from "./screens/Entry";
import { Records } from "./screens/Records";
import { Accounts } from "./screens/Accounts";
import { Profile } from "./screens/Profile";
export function Workspace({ user, setUser, tab, setTab, error, setError, logout }) {
  const { width, height } = useWindowDimensions();
  const wide = width >= 1050;
  const { settings, error: settingsError, refresh } = useOrganization();
  if (!settings)
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16 }}>
        <ActivityIndicator color={colors.primary} />
        <Text style={s.muted}>Loading workspace settings…</Text>
        <Message text={settingsError} error />
        {!!settingsError && <Button title="Retry settings" secondary onPress={refresh} />}
      </View>
    );
  const admin = user.role !== "security";
  const tabs = [
    ["Overview", "grid"],
    ...(!admin
      ? [
          ["Vehicle entry", "log-in"],
          ["Vehicle exit", "log-out"],
        ]
      : [["Approvals", "check-square"]]),
    ["Vehicle records", "list"],
    ...(user.role === "superadmin"
      ? [
          ["Accounts", "users"],
          ["Organization settings", "settings"],
        ]
      : []),
    ["My profile", "user"],
  ];
  const navigate = (value) => {
    setTab(value);
    setError("");
  };
  const nav = tabs.map(([label, icon]) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        selected: tab === label,
      }}
      onPress={() => navigate(label)}
      style={{
        padding: 13,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: tab === label ? "#e7edff" : "transparent",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Feather name={icon} size={18} color={tab === label ? "#3458d4" : "#bdc9e0"} />
      <Text
        style={{
          color: tab === label ? "#3458d4" : "#bdc9e0",
          fontSize: 13,
          fontWeight: tab === label ? "700" : "500",
        }}
      >
        {label}
      </Text>
    </Pressable>
  ));
  return (
    <View
      style={{
        flex: 1,
        flexDirection: wide ? "row" : "column",
        backgroundColor: colors.bg,
      }}
    >
      {wide ? (
        <View
          style={{
            width: 242,
            padding: 20,
            backgroundColor: "#17243a",
            gap: 16,
          }}
        >
          <View
            style={[
              s.row,
              {
                paddingVertical: 13,
              },
            ]}
          >
            <BrandMark size={38} />
            <View>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 17,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                }}
              >
                GATEPILOT
              </Text>
              <Text
                style={{
                  color: "#a8b8d8",
                  fontSize: 9,
                  marginTop: 4,
                }}
              >
                {settings.name.toUpperCase()}
              </Text>
            </View>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: 6,
            }}
          >
            <Text
              style={{
                color: "#9dafd1",
                fontSize: 10,
                letterSpacing: 2,
                marginLeft: 16,
                marginBottom: 14,
              }}
            >
              WORKSPACE
            </Text>
            {nav}
          </ScrollView>
          {height > 850 && (
            <View
              style={{
                backgroundColor: "#202f4f",
                borderRadius: 13,
                padding: 15,
                gap: 7,
              }}
            >
              <Feather name="shield" size={20} color="#9ef0d3" />
              <Text
                style={{
                  color: "#e2e8f5",
                  fontSize: 12,
                }}
              >
                Every movement, connected.
              </Text>
              <Text
                style={{
                  color: "#b2c0da",
                  fontSize: 11,
                  lineHeight: 18,
                }}
              >
                Your workspace follows your assigned organization role.
              </Text>
            </View>
          )}
          <Button title="Sign out" icon="log-out" onPress={logout} />
        </View>
      ) : (
        <View
          style={{
            backgroundColor: "#17243a",
            paddingTop: 12,
          }}
        >
          <View
            style={[
              s.row,
              {
                paddingHorizontal: 18,
                justifyContent: "space-between",
              },
            ]}
          >
            <View style={s.row}>
              <BrandMark size={30} />
              <View>
                <Text
                  style={{
                    color: "white",
                    fontWeight: "700",
                    letterSpacing: 0.5,
                  }}
                >
                  GATEPILOT
                </Text>
                <Text
                  style={{
                    color: "#c4cee3",
                    fontSize: 10,
                  }}
                >
                  {settings.name}
                </Text>
              </View>
            </View>
            <Button title="Sign out" onPress={logout} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 5,
              padding: 10,
            }}
          >
            {nav}
          </ScrollView>
        </View>
      )}
      <View
        style={{
          flex: 1,
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingHorizontal: wide ? 36 : 20,
            paddingVertical: 17,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 11,
                color: colors.muted,
              }}
            >
              Access operations / {tab}
            </Text>
            <Text
              style={{
                color: colors.ink,
                fontSize: 13,
                marginTop: 5,
                fontWeight: "600",
              }}
            >
              {user.department || user.gate || "Organization administration"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open my profile"
            onPress={() => navigate("My profile")}
            style={s.row}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#e8eeff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "700",
                }}
              >
                {user.name?.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            {wide && (
              <View>
                <Text
                  style={{
                    color: colors.ink,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {user.name}
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 11,
                    marginTop: 3,
                  }}
                >
                  {user.role === "superadmin"
                    ? "Organization administrator"
                    : user.role === "admin"
                      ? "Department administrator"
                      : "Security officer"}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        <PrototypeNotice compact />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: wide ? 36 : 18,
            gap: 22,
            maxWidth: 1500,
            width: "100%",
            alignSelf: "center",
            paddingBottom: 50,
          }}
        >
          <Message text={error} error />
          {tab === "Organization settings" && user.role === "superadmin" && <SettingsScreen />}
          {tab === "Overview" && <Dashboard user={user} navigate={navigate} />}
          {["Vehicle records", "Vehicle exit", "Approvals"].includes(tab) && (
            <Records key={tab} mode={tab} user={user} />
          )}
          {tab === "Vehicle entry" && <Entry user={user} />}
          {tab === "Accounts" && <Accounts />}
          {tab === "My profile" && (
            <Profile
              user={user}
              onUpdate={setUser}
              onPasswordChange={async () => {
                await saveToken(null);
                setUser(null);
                setTab("Overview");
              }}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}
