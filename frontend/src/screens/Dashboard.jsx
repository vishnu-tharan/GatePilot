import { Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Button, Empty, colors, styles } from "../ui";
import { useOrganization } from "../organization";
import { useLoad } from "../hooks/useLoad";
import { Heading, LoadState, RecordCard } from "../components/ScreenElements";

export function Dashboard({ user, navigate }) {
  const { settings } = useOrganization();
  const state = useLoad("/dashboard");

  const isGuard = user.role === "security";

  return (
    <>
      {/* Executive Command Header */}
      <Heading
        title="Command Overview"
        subtitle={`Live access telemetrics for ${settings.name}`}
        action={
          <Button
            title="Refresh Data"
            icon="refresh-cw"
            secondary
            small
            onPress={state.reload}
            busy={state.loading}
          />
        }
      />

      <LoadState state={state} />

      {/* Operational Dispatch Banner */}
      <View
        style={{
          backgroundColor: "#0b0f19",
          borderRadius: 20,
          padding: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
          shadowColor: "#0f172a",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View style={{ gap: 6, minWidth: 260, flex: 1 }}>
          <View style={[styles.row, { gap: 8, alignItems: "center" }]}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10b981" }} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#93c5fd",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Active Station · {user.gate || user.department || "Operations Central"}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#ffffff", letterSpacing: -0.5 }}>
            {isGuard ? "Security Gate Terminal" : "Department Review Terminal"}
          </Text>
          <Text style={{ fontSize: 13, color: "#94a3b8", lineHeight: 20, maxWidth: 520 }}>
            {isGuard
              ? "All vehicle movements are monitored in real time. Carried equipment must be authorized by department managers before release."
              : "Review equipment requests, inspect serial numbers, and sign off on visitor entry passes."}
          </Text>
        </View>

        <View style={[styles.row, { gap: 10 }]}>
          {isGuard ? (
            <Button
              title="Record New Arrival"
              icon="plus-circle"
              onPress={() => navigate("Vehicle entry")}
            />
          ) : (
            <Button
              title="Review Equipment"
              icon="check-circle"
              onPress={() => navigate("Approvals")}
            />
          )}
          <Button title="Movement Log" secondary onPress={() => navigate("Vehicle records")} />
        </View>
      </View>

      {/* 3 High-Impact Key Metrics */}
      <View style={[styles.row, { alignItems: "stretch" }]}>
        {[
          {
            label: "VEHICLES INSIDE",
            val: state.data?.inside ?? 0,
            icon: "truck",
            accentColor: colors.primary,
            bgLight: "rgba(37, 99, 235, 0.08)",
            caption: "Active on-site visitors",
          },
          {
            label: "PENDING APPROVAL",
            val: state.data?.pending ?? 0,
            icon: "clock",
            accentColor: colors.amber,
            bgLight: "rgba(217, 119, 6, 0.08)",
            caption: "Require manager clearance",
          },
          {
            label: "LOGGED TODAY",
            val: state.data?.today ?? 0,
            icon: "log-in",
            accentColor: colors.green,
            bgLight: "rgba(16, 185, 129, 0.08)",
            caption: "Entries since midnight UTC",
          },
        ].map((item) => (
          <View
            key={item.label}
            style={[
              styles.card,
              {
                flex: 1,
                minWidth: 220,
                padding: 22,
                gap: 12,
              },
            ]}
          >
            <View style={[styles.row, { justifyContent: "space-between", alignItems: "center" }]}>
              <Text style={styles.sectionTitle}>{item.label}</Text>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: item.bgLight,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name={item.icon} size={18} color={item.accentColor} />
              </View>
            </View>

            <Text
              style={{
                fontSize: 38,
                fontWeight: "900",
                color: colors.ink,
                letterSpacing: -1,
                lineHeight: 44,
              }}
            >
              {item.val}
            </Text>

            <View style={{ height: 1, backgroundColor: "#f1f5f9" }} />

            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "500" }}>
              {item.caption}
            </Text>
          </View>
        ))}
      </View>

      {/* Activity Ledger & Gate Split */}
      <View style={[styles.row, { alignItems: "flex-start", gap: 20 }]}>
        {/* Recent Movements Ledger */}
        <View style={[styles.card, { flex: 2, minWidth: 320, padding: 24 }]}>
          <View
            style={[
              styles.row,
              { justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
            ]}
          >
            <View>
              <Text style={styles.title}>Live Movement Feed</Text>
              <Text style={[styles.muted, { fontSize: 12 }]}>Most recent vehicle interactions</Text>
            </View>
            <Button title="View All" secondary small onPress={() => navigate("Vehicle records")} />
          </View>

          <View style={{ gap: 10, marginTop: 4 }}>
            {state.data?.recent?.length ? (
              state.data.recent.map((record) => (
                <RecordCard
                  item={record}
                  key={record.passId}
                  onOpen={() => navigate("Vehicle records")}
                />
              ))
            ) : !state.loading ? (
              <Empty
                title="No Movements Recorded"
                detail="Once vehicles check in, their live cards will appear in this feed."
              />
            ) : null}
          </View>
        </View>

        {/* Gate Activity Meters */}
        <View style={[styles.card, { flex: 1, minWidth: 260, padding: 24 }]}>
          <Text style={styles.title}>Gate Activity</Text>
          <Text style={[styles.muted, { fontSize: 12, marginBottom: 8 }]}>
            Current traffic distribution
          </Text>

          <View style={{ gap: 16 }}>
            {state.data?.gates?.map((g) => {
              const totalInside = state.data?.inside || 1;
              const pct = state.data?.inside ? Math.round((g.inside / totalInside) * 100) : 0;
              return (
                <View key={g.gate} style={{ gap: 6 }}>
                  <View style={[styles.row, { justifyContent: "space-between" }]}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink }}>
                      {g.gate}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
                      {g.inside} cars ({pct}%)
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#f1f5f9",
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.primary,
                        width: `${pct}%`,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <View
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.muted, lineHeight: 16 }}>
              Metrics are automatically aggregated from verified entry and exit scans across all
              active checkpoints.
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}
