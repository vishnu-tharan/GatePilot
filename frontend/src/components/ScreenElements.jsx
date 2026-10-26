import { ActivityIndicator, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Badge, Button, Message, colors, date, s } from "../ui";
export function Heading({ title, subtitle, action }) {
  return (
    <View
      style={[
        s.row,
        {
          justifyContent: "space-between",
          marginBottom: 2,
        },
      ]}
    >
      <View
        style={{
          flex: 1,
          minWidth: 200,
          gap: 7,
        }}
      >
        <Text
          style={[
            s.title,
            {
              fontSize: 28,
            },
          ]}
        >
          {title}
        </Text>
        <Text style={s.muted}>{subtitle}</Text>
      </View>
      {action}
    </View>
  );
}
export function LoadState({ state }) {
  return (
    <>
      <Message text={state.error} error />
      {state.loading && <ActivityIndicator color={colors.primary} />}
      {!!state.error && <Button title="Try again" secondary onPress={state.reload} />}
    </>
  );
}
export function RecordCard({ item, onOpen }) {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: 17,
        gap: 11,
      }}
    >
      <View
        style={[
          s.row,
          {
            justifyContent: "space-between",
          },
        ]}
      >
        <View
          style={[
            s.row,
            {
              flex: 1,
              minWidth: 180,
            },
          ]}
        >
          <View
            style={{
              padding: 12,
              borderRadius: 11,
              backgroundColor: colors.bg,
            }}
          >
            <Feather name="truck" size={19} color={colors.primary} />
          </View>
          <View>
            <Text
              style={[
                s.text,
                {
                  fontWeight: "700",
                  letterSpacing: 0.5,
                },
              ]}
            >
              {item.vehicleNumber}
            </Text>
            <Text style={s.muted}>
              {item.driverName} · {item.department}
            </Text>
          </View>
        </View>
        <Badge status={item.outTime ? "Exited" : item.approvalStatus} />
        {onOpen && <Button title="View details" secondary small onPress={() => onOpen(item)} />}
      </View>
      <Text
        style={[
          s.muted,
          {
            fontSize: 11,
          },
        ]}
      >
        {item.entryGate} · Arrived {date(item.inTime)}
        {item.outTime ? ` · Exited ${date(item.outTime)}` : ""}
      </Text>
    </View>
  );
}
