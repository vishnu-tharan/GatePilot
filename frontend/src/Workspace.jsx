import {
  ActivityIndicator,
  Text,
  View,
  useWindowDimensions,
  Pressable,
  ScrollView,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Button, Message, colors, styles } from "./ui";
import { useOrganization } from "./organization";
import { BrandMark } from "./brand";
import { SettingsScreen } from "./screens/Settings";
import { Dashboard } from "./screens/Dashboard";
import { Entry } from "./screens/Entry";
import { Records } from "./screens/Records";
import { Accounts } from "./screens/Accounts";
import { Profile } from "./screens/Profile";

export function Workspace({ user, setUser, tab, setTab, error, setError, logout }) {
  const { width } = useWindowDimensions();
  const wide = width >= 960;
  const { settings, error: settingsError, refresh } = useOrganization();

  if (!settings) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.bg,
          padding: 24,
          gap: 16,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.muted, { fontWeight: "600" }]}>Connecting to Gate Terminal...</Text>
        <Message text={settingsError} error />
        {!!settingsError && <Button title="Retry Connection" secondary onPress={refresh} />}
      </View>
    );
  }

  const isGuard = user.role === "security";
  const isSuperadmin = user.role === "superadmin";

  // Categorized Navigation Menu
  const menuSections = [
    {
      category: "OPERATIONS",
      items: [
        ["Overview", "pie-chart"],
        ...(isGuard
          ? [
              ["Vehicle entry", "log-in"],
              ["Vehicle exit", "log-out"],
            ]
          : [["Approvals", "check-square"]]),
        ["Vehicle records", "list"],
      ],
    },
    {
      category: "MANAGEMENT",
      items: [
        ...(isSuperadmin
          ? [
              ["Accounts", "users"],
              ["Organization settings", "sliders"],
            ]
          : []),
        ["My profile", "user"],
      ],
    },
  ];

  const navigate = (newTab) => {
    setTab(newTab);
    setError("");
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: wide ? "row" : "column",
        backgroundColor: colors.bg,
      }}
    >
      {/* 1. Desktop Executive Dark Sidebar */}
      {wide ? (
        <View
          style={{
            width: 256,
            padding: 20,
            backgroundColor: colors.sidebarBg,
            borderRightWidth: 1,
            borderRightColor: colors.sidebarBorder,
            justifyContent: "space-between",
          }}
        >
          <View style={{ gap: 20 }}>
            {/* Brand Title Lockup */}
            <View style={[styles.row, { gap: 12, alignItems: "center", paddingVertical: 4 }]}>
              <BrandMark size={36} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 17,
                    fontWeight: "800",
                    letterSpacing: 0.5,
                  }}
                >
                  GATEPILOT
                </Text>
                <View style={[styles.row, { gap: 5, marginTop: 2, alignItems: "center" }]}>
                  <View
                    style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" }}
                  />
                  <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: "500" }}>
                    {settings.name}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: colors.sidebarBorder }} />

            {/* Navigation Menus */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 18 }}>
              {menuSections.map((section) => (
                <View key={section.category} style={{ gap: 4 }}>
                  <Text
                    style={{
                      color: "#475569",
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 1.4,
                      marginLeft: 12,
                      marginBottom: 4,
                    }}
                  >
                    {section.category}
                  </Text>
                  {section.items.map(([label, icon]) => {
                    const isSelected = tab === label;
                    return (
                      <Pressable
                        key={label}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        onPress={() => navigate(label)}
                        style={({ pressed }) => [
                          {
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 10,
                            backgroundColor: isSelected
                              ? "rgba(37, 99, 235, 0.18)"
                              : pressed
                                ? "rgba(255, 255, 255, 0.05)"
                                : "transparent",
                            borderWidth: 1,
                            borderColor: isSelected ? "rgba(59, 130, 246, 0.3)" : "transparent",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                          },
                        ]}
                      >
                        <Feather name={icon} size={16} color={isSelected ? "#60a5fa" : "#64748b"} />
                        <Text
                          style={{
                            color: isSelected ? "#ffffff" : "#94a3b8",
                            fontSize: 13,
                            fontWeight: isSelected ? "700" : "500",
                          }}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* User Profile Footer Widget */}
          <View
            style={{
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: colors.sidebarBorder,
              gap: 12,
            }}
          >
            <View style={[styles.row, { gap: 10, alignItems: "center" }]}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(37, 99, 235, 0.2)",
                  borderWidth: 1,
                  borderColor: "rgba(59, 130, 246, 0.4)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#93c5fd", fontWeight: "800", fontSize: 13 }}>
                  {user.name?.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "700" }}>
                  {user.name}
                </Text>
                <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "500" }}>
                  {user.role === "superadmin"
                    ? "Org Administrator"
                    : user.role === "admin"
                      ? `${user.department || "Dept"} Admin`
                      : `Security (${user.gate || "Gate"})`}
                </Text>
              </View>
            </View>

            <Button title="Sign out" icon="log-out" secondary small onPress={logout} />
          </View>
        </View>
      ) : (
        /* 2. Mobile High-Contrast App Bar */
        <View style={{ backgroundColor: colors.sidebarBg, paddingTop: 10 }}>
          <View
            style={[
              styles.row,
              { paddingHorizontal: 16, paddingBottom: 10, justifyContent: "space-between" },
            ]}
          >
            <View style={[styles.row, { gap: 10, alignItems: "center" }]}>
              <BrandMark size={28} />
              <View>
                <Text
                  style={{ color: "#ffffff", fontWeight: "800", fontSize: 15, letterSpacing: 0.5 }}
                >
                  GATEPILOT
                </Text>
                <Text style={{ color: "#64748b", fontSize: 10 }}>{settings.name}</Text>
              </View>
            </View>
            <Button title="Exit" secondary small onPress={logout} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingHorizontal: 12, paddingBottom: 10 }}
          >
            {menuSections
              .flatMap((s) => s.items)
              .map(([label, icon]) => {
                const isSelected = tab === label;
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    onPress={() => navigate(label)}
                    style={{
                      paddingHorizontal: 13,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor: isSelected ? colors.primary : "rgba(255,255,255,0.06)",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Feather name={icon} size={14} color={isSelected ? "#ffffff" : "#94a3b8"} />
                    <Text
                      style={{
                        color: isSelected ? "#ffffff" : "#94a3b8",
                        fontSize: 12,
                        fontWeight: isSelected ? "700" : "500",
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
          </ScrollView>
        </View>
      )}

      {/* 3. Main Operational Viewport */}
      <View style={{ flex: 1 }}>
        {/* Top Header Bar on Desktop */}
        {wide ? (
          <View
            style={{
              backgroundColor: "#ffffff",
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingHorizontal: 36,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Breadcrumb Indicator */}
            <View style={[styles.row, { gap: 8, alignItems: "center" }]}>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "500" }}>
                Workspace
              </Text>
              <Feather name="chevron-right" size={12} color={colors.mutedLight} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink }}>{tab}</Text>
              <View
                style={{
                  backgroundColor: colors.softAccent,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  marginLeft: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>
                  {user.gate || user.department || "HQ"}
                </Text>
              </View>
            </View>

            {/* Quick Profile Link */}
            <Pressable
              onPress={() => navigate("My profile")}
              style={({ pressed }) => [
                styles.row,
                { gap: 10, opacity: pressed ? 0.8 : 1, alignItems: "center" },
              ]}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.inkSecondary }}>
                {user.name}
              </Text>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: colors.softAccent,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="user" size={14} color={colors.primary} />
              </View>
            </Pressable>
          </View>
        ) : null}

        {/* Scrollable Canvas */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: wide ? 36 : 18,
            gap: 24,
            maxWidth: 1280,
            width: "100%",
            alignSelf: "center",
            paddingBottom: 72,
          }}
        >
          <Message text={error} error />

          {tab === "Overview" && <Dashboard user={user} navigate={navigate} />}
          {tab === "Vehicle entry" && <Entry user={user} />}
          {["Vehicle records", "Vehicle exit", "Approvals"].includes(tab) && (
            <Records key={tab} mode={tab} user={user} />
          )}
          {tab === "Accounts" && isSuperadmin && <Accounts />}
          {tab === "Organization settings" && isSuperadmin && <SettingsScreen />}
          {tab === "My profile" && (
            <Profile
              user={user}
              onUpdate={setUser}
              onPasswordChange={async () => {
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
