import { ActivityIndicator, Text, View, Pressable } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Badge, Button, Message, colors, date, styles } from "../ui";

export function Heading({ title, subtitle, action }) {
  return (
    <View
      style={[
        styles.row,
        {
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 4,
          gap: 16,
        },
      ]}
    >
      <View style={{ flex: 1, minWidth: 220, gap: 4 }}>
        <Text
          style={[
            styles.title,
            {
              fontSize: 26,
              letterSpacing: -0.8,
            },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.muted, { fontSize: 13, lineHeight: 19 }]}>{subtitle}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function LoadState({ state }) {
  return (
    <>
      <Message text={state.error} error />
      {state.loading && (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      {!!state.error && <Button title="Try again" secondary onPress={state.reload} />}
    </>
  );
}

// Enterprise-grade Record Row Card
export function RecordCard({ item, onOpen }) {
  return (
    <Pressable
      onPress={() => onOpen?.(item)}
      style={({ pressed }) => [
        {
          backgroundColor: "#ffffff",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          gap: 12,
          opacity: pressed ? 0.92 : 1,
          shadowColor: "#0f172a",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 3,
          elevation: 1,
        },
      ]}
    >
      <View style={[styles.row, { justifyContent: "space-between", alignItems: "center" }]}>
        {/* Left: License plate badge & Driver info */}
        <View style={[styles.row, { gap: 12, flex: 1, minWidth: 200 }]}>
          {/* License Plate Capsule */}
          <View
            style={{
              backgroundColor: "#0f172a",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <Text
              style={{
                color: "#f8fafc",
                fontWeight: "800",
                fontSize: 13,
                letterSpacing: 1.2,
                fontFamily: "monospace",
              }}
            >
              {item.vehicleNumber}
            </Text>
          </View>

          <View style={{ gap: 2 }}>
            <Text style={{ fontWeight: "700", fontSize: 14, color: colors.ink }}>
              {item.driverName}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {item.department} · {item.driverPhone || "No phone"}
            </Text>
          </View>
        </View>

        {/* Right: Badge & Details Action */}
        <View style={[styles.row, { gap: 10 }]}>
          <Badge status={item.outTime ? "Exited" : item.approvalStatus} />
          {onOpen ? <Button title="Inspect" secondary small onPress={() => onOpen(item)} /> : null}
        </View>
      </View>

      {/* Meta Footer */}
      <View
        style={[
          styles.row,
          {
            justifyContent: "space-between",
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: "#f1f5f9",
            gap: 10,
          },
        ]}
      >
        <View style={[styles.row, { gap: 6 }]}>
          <Feather name="log-in" size={13} color={colors.muted} />
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Entered {date(item.inTime)} via{" "}
            <Text style={{ fontWeight: "600", color: colors.inkSecondary }}>{item.entryGate}</Text>
          </Text>
        </View>

        {item.outTime ? (
          <View style={[styles.row, { gap: 6 }]}>
            <Feather name="log-out" size={13} color={colors.muted} />
            <Text style={{ fontSize: 12, color: colors.muted }}>
              Departed {date(item.outTime)} ({item.exitGate || "Gate"})
            </Text>
          </View>
        ) : (
          <View style={[styles.row, { gap: 5 }]}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green }} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.green }}>
              Active on campus
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
