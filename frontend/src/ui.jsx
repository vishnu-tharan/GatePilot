import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";

// Enterprise Design Tokens (Linear / Modern SaaS aesthetic)
export const colors = {
  ink: "#090d16", // True Deep Charcoal
  inkSecondary: "#334155", // Slate 700
  muted: "#64748b", // Slate 500
  mutedLight: "#94a3b8", // Slate 400
  primary: "#2563eb", // Royal Blue
  primaryDark: "#1d4ed8", // Indigo-Blue Dark
  primaryLight: "#dbeafe", // Blue 100
  softAccent: "#eff6ff", // Blue 50
  bg: "#f8fafc", // Crisp Off-White Canvas
  cardBg: "#ffffff",
  border: "#e2e8f0", // Subtle Border
  borderDark: "#cbd5e1",
  sidebarBg: "#0b0f19", // Obsidian Midnight Sidebar
  sidebarBorder: "#1e293b",
  green: "#059669", // Emerald 600
  greenLight: "#d1fae5", // Emerald 100
  greenSoft: "#ecfdf5", // Emerald 50
  amber: "#d97706", // Amber 600
  amberLight: "#fef3c7",
  amberSoft: "#fffbeb",
  red: "#e11d48", // Rose 600
  redLight: "#ffe4e6",
  redSoft: "#fff1f2",
};

export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: colors.cardBg,
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  text: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 22,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.inkSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: "#ffffff",
    minHeight: 48,
  },
  button: {
    minHeight: 44,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
});

export function Button({
  title,
  onPress,
  icon,
  secondary,
  success,
  danger,
  disabled,
  busy,
  small,
}) {
  let bg = colors.primary;
  let textColor = "#ffffff";
  let borderWidth = 0;
  let borderColor = "transparent";

  if (secondary) {
    bg = "#ffffff";
    textColor = colors.inkSecondary;
    borderWidth = 1.5;
    borderColor = colors.border;
  } else if (success) {
    bg = colors.green;
    textColor = "#ffffff";
  } else if (danger) {
    bg = colors.red;
    textColor = "#ffffff";
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderWidth,
          borderColor,
          opacity: disabled || busy ? 0.5 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !disabled && !busy ? 0.99 : 1 }],
          ...(small
            ? { paddingVertical: 7, minHeight: 34, paddingHorizontal: 12, borderRadius: 9 }
            : {}),
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        icon && <Feather name={icon} size={small ? 14 : 16} color={textColor} />
      )}
      <Text
        style={{
          fontWeight: "700",
          fontSize: small ? 12 : 13,
          color: textColor,
          letterSpacing: 0.1,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChange,
  password,
  multiline,
  placeholder,
  keyboardType,
  editable = true,
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 0, flexGrow: 1 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={{ position: "relative", justifyContent: "center" }}>
        <TextInput
          accessibilityLabel={label}
          value={value || ""}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={password && !visible}
          multiline={multiline}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          keyboardType={keyboardType}
          autoCapitalize={password || keyboardType === "email-address" ? "none" : "sentences"}
          autoCorrect={!password}
          editable={editable}
          style={[
            styles.input,
            {
              borderColor: focused ? colors.primary : colors.border,
              backgroundColor: !editable ? "#f8fafc" : "#ffffff",
              ...(multiline ? { minHeight: 88, textAlignVertical: "top" } : {}),
              ...(!editable ? { opacity: 0.7 } : {}),
            },
          ]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            onPress={() => setVisible(!visible)}
            style={{
              padding: 10,
              position: "absolute",
              right: 8,
              top: multiline ? 10 : 8,
            }}
          >
            <Feather name={visible ? "eye-off" : "eye"} size={17} color={colors.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function Choices({ label, options, value, onChange }) {
  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, { gap: 8 }]}>
        {options.map((option) => {
          const isSelected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderWidth: 1.5,
                  borderRadius: 10,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.softAccent : "#ffffff",
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: isSelected ? colors.primary : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isSelected ? 0.15 : 0,
                  shadowRadius: 3,
                },
              ]}
            >
              <Text
                style={{
                  color: isSelected ? colors.primary : colors.inkSecondary,
                  fontSize: 13,
                  fontWeight: isSelected ? "700" : "500",
                }}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Sleek Pill Badges with inline status dot
export function Badge({ status }) {
  let bg = colors.greenSoft;
  let text = colors.green;
  let dot = colors.green;
  let label = status;

  if (status === "Rejected") {
    bg = colors.redSoft;
    text = colors.red;
    dot = colors.red;
  } else if (status === "Pending Approval") {
    bg = colors.amberSoft;
    text = colors.amber;
    dot = colors.amber;
  } else if (status === "Exited") {
    bg = "#f1f5f9";
    text = colors.muted;
    dot = colors.mutedLight;
  }

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignSelf: "flex-start",
        borderWidth: 1,
        borderColor: `${text}25`,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: dot,
        }}
      />
      <Text style={{ color: text, fontSize: 11, fontWeight: "700", letterSpacing: 0.2 }}>
        {label}
      </Text>
    </View>
  );
}

export function Empty({
  title = "No records found",
  detail = "Records will appear here once activity begins.",
  icon = "inbox",
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 44, paddingHorizontal: 20, gap: 10 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#f1f5f9",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        <Feather name={icon} size={24} color={colors.muted} />
      </View>
      <Text style={[styles.text, { fontWeight: "800", fontSize: 16 }]}>{title}</Text>
      <Text style={[styles.muted, { textAlign: "center", maxWidth: 320, lineHeight: 20 }]}>
        {detail}
      </Text>
    </View>
  );
}

export function Dialog({ title, children, onClose }) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(11, 15, 25, 0.65)",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <View
          style={[
            styles.card,
            {
              width: "100%",
              maxWidth: 600,
              maxHeight: "90%",
              padding: 26,
              borderRadius: 22,
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 10,
            },
          ]}
        >
          <View
            style={[
              styles.row,
              { justifyContent: "space-between", marginBottom: 6, alignItems: "center" },
            ]}
          >
            <Text style={[styles.title, { fontSize: 21 }]}>{title}</Text>
            <Button title="Close" secondary small onPress={onClose} />
          </View>
          <ScrollView
            contentContainerStyle={{ gap: 16, paddingBottom: 6 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function Message({ text, error }) {
  if (!text) return null;
  return (
    <View
      accessibilityRole="alert"
      style={{
        padding: 14,
        borderRadius: 12,
        backgroundColor: error ? colors.redSoft : colors.softAccent,
        borderWidth: 1,
        borderColor: error ? `${colors.red}30` : `${colors.primary}30`,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Feather
        name={error ? "alert-circle" : "check-circle"}
        size={18}
        color={error ? colors.red : colors.primary}
      />
      <Text
        style={{
          color: error ? colors.red : colors.primaryDark,
          fontSize: 13,
          lineHeight: 19,
          fontWeight: "600",
          flex: 1,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

export const date = (value) => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return value;
  }
};
