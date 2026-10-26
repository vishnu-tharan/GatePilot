import { Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Button, Empty, colors, styles } from "../ui";
import { useOrganization } from "../organization";
import { useLoad } from "../hooks/useLoad";
import { Heading, LoadState, RecordCard } from "../components/ScreenElements";
export function Dashboard({ user, navigate }) {
  const { settings } = useOrganization();

  const state = useLoad("/dashboard");
  return (
    <>
      <Heading
        title="Access overview"
        subtitle={`${settings.name} · Arrivals, reviews, and departures in one place.`}
        action={
          <Button
            title="Refresh"
            icon="refresh-cw"
            secondary
            onPress={state.reload}
            busy={state.loading}
          />
        }
      />
      <LoadState state={state} />
      <View
        style={{
          backgroundColor: "#e8eeff",
          borderRadius: 18,
          padding: 27,
          gap: 15,
          borderWidth: 1,
          borderColor: "#dce3f0",
        }}
      >
        <View style={styles.row}>
          <Feather name="sun" size={19} color={colors.primary} />
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.primary,
              letterSpacing: 1.6,
            }}
          >
            {settings.name.toUpperCase()} / ACCESS DESK
          </Text>
        </View>
        <Text
          style={[
            styles.title,
            {
              maxWidth: 550,
            },
          ]}
        >
          One view. Every movement.
        </Text>
        <Text
          style={[
            styles.muted,
            {
              maxWidth: 550,
            },
          ]}
        >
          Follow activity at each gate, review equipment requests, and keep arrivals and departures
          moving with clear records.
        </Text>
        <View style={styles.row}>
          <Button
            title={user.role === "security" ? "Record an arrival" : "Review approvals"}
            icon={user.role === "security" ? "plus" : "check-square"}
            onPress={() => navigate(user.role === "security" ? "Vehicle entry" : "Approvals")}
          />
          <Button
            title="Explore vehicle records"
            secondary
            onPress={() => navigate("Vehicle records")}
          />
        </View>
      </View>
      <View
        style={[
          styles.row,
          {
            alignItems: "stretch",
          },
        ]}
      >
        {[
          ["Vehicles inside", state.data?.inside, "truck", "Current active visits"],
          ["Awaiting approval", state.data?.pending, "clock", "Equipment requests"],
          ["Arrivals today", state.data?.today, "log-in", "Since midnight UTC"],
        ].map(([label, value, icon, description]) => (
          <View
            key={label}
            style={[
              styles.card,
              {
                flex: 1,
                minWidth: 200,
              },
            ]}
          >
            <View
              style={[
                styles.row,
                {
                  justifyContent: "space-between",
                },
              ]}
            >
              <Text style={styles.muted}>{label}</Text>
              <Feather name={icon} size={18} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 38,
                fontWeight: "700",
                color: colors.ink,
                letterSpacing: -1,
              }}
            >
              {value ?? "—"}
            </Text>
            <Text
              style={[
                styles.muted,
                {
                  fontSize: 11,
                },
              ]}
            >
              {description}
            </Text>
          </View>
        ))}
      </View>
      <View
        style={[
          styles.row,
          {
            alignItems: "stretch",
          },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              flex: 2,
              minWidth: 270,
            },
          ]}
        >
          <View
            style={[
              styles.row,
              {
                justifyContent: "space-between",
              },
            ]}
          >
            <Text style={styles.title}>Recent movements</Text>
            <Text
              style={[
                styles.muted,
                {
                  fontSize: 11,
                },
              ]}
            >
              Use Refresh for the latest records
            </Text>
          </View>
          {state.data?.recent?.length
            ? state.data.recent.map((item) => <RecordCard item={item} key={item.passId} />)
            : !state.loading && (
                <Empty
                  title="A fresh start"
                  detail="Vehicle movements will appear after the first entry."
                />
              )}
        </View>
        <View
          style={[
            styles.card,
            {
              flex: 1,
              minWidth: 250,
            },
          ]}
        >
          <Text style={styles.title}>Around the gates</Text>
          <Text style={styles.muted}>Active visits by entry gate</Text>
          {state.data?.gates.map((item, index) => (
            <View
              key={item.gate}
              style={{
                paddingVertical: 15,
                gap: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View
                style={[
                  styles.row,
                  {
                    justifyContent: "space-between",
                  },
                ]}
              >
                <View style={styles.row}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.muted,
                    }}
                  >
                    0{index + 1}
                  </Text>
                  <Text
                    style={[
                      styles.text,
                      {
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {item.gate}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.text,
                    {
                      fontWeight: "700",
                    },
                  ]}
                >
                  {item.inside}
                </Text>
              </View>
              <View
                style={{
                  height: 5,
                  borderRadius: 4,
                  backgroundColor: "#e8edf7",
                }}
              >
                <View
                  style={{
                    height: 5,
                    borderRadius: 4,
                    backgroundColor: "#7391e9",
                    width: `${state.data.inside ? (item.inside / state.data.inside) * 100 : 0}%`,
                  }}
                />
              </View>
            </View>
          ))}
          <Text
            style={[
              styles.muted,
              {
                fontSize: 11,
              },
            ]}
          >
            Counts reflect your permitted department scope. They do not indicate whether a gate is
            staffed.
          </Text>
        </View>
      </View>
    </>
  );
}
