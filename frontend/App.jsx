import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { api, restoreToken, saveToken, setUnauthorizedHandler } from "./src/api";
import { colors, styles } from "./src/ui";
import { OrganizationProvider } from "./src/organization";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Login } from "./src/screens/Login";
import { Workspace } from "./src/Workspace";
function GatePilot() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setUnauthorizedHandler(() => {
      setUser(null);
      setTab("Overview");
    });
    restoreToken()
      .then(() => api("/user/me"))
      .then((value) => {
        if (mounted) setUser(value);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
      setUnauthorizedHandler(() => {});
    };
  }, []);
  async function logout() {
    try {
      await api("/user/logout", "POST", {});
      await saveToken(null);
      setUser(null);
      setTab("Overview");
    } catch (e) {
      setError(e.message);
    }
  }
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.muted}>Opening GatePilot…</Text>
      </View>
    );
  if (!user)
    return (
      <Login
        onLogin={(value) => {
          setUser(value);
          setError("");
        }}
      />
    );
  return (
    <OrganizationProvider>
      <Workspace
        user={user}
        setUser={setUser}
        tab={tab}
        setTab={setTab}
        error={error}
        setError={setError}
        logout={logout}
      />
    </OrganizationProvider>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#17243a",
        }}
      >
        <StatusBar style="auto" />
        <GatePilot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
