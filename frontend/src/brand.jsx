import { Image, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { branding } from "./branding.mjs";
import { colors } from "./ui";

export function BrandMark({ size = 44 }) {
  return (
    <Image
      accessibilityLabel="GatePilot logo"
      source={require("../public/gatepilot-icon.png")}
      style={{ width: size, height: size, borderRadius: size * 0.23 }}
      resizeMode="contain"
    />
  );
}

export function PrototypeNotice({ compact = false }) {
  return (
    <View
      style={{
        backgroundColor: colors.softAccent,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: compact ? 0 : 12,
        paddingHorizontal: compact ? 20 : 14,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Feather name="info" size={17} color={colors.primary} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>
          Independent prototype
        </Text>
        <Text style={{ color: colors.ink, fontSize: 11, lineHeight: 17 }}>{branding.notice}</Text>
      </View>
    </View>
  );
}
