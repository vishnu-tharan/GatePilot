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
export const colors = {
  ink: "#17243a",
  muted: "#63738c",
  primary: "#3458d4",
  softAccent: "#e8eeff",
  bg: "#f3f5fb",
  border: "#dce3f0",
  amber: "#946016",
  red: "#b14355",
};
export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  text: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: "#fafbfe",
    minHeight: 46,
  },
  button: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 17,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },
  divider: { height: 1, backgroundColor: colors.border },
});
export function Button({ title, onPress, icon, secondary, danger, disabled, busy, small }) {
  const bg = secondary ? "#edf1fc" : danger ? colors.red : colors.primary;
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
          opacity: disabled || busy ? 0.5 : pressed ? 0.8 : 1,
          ...(small ? { paddingVertical: 8, minHeight: 38 } : {}),
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={secondary ? colors.primary : "white"} />
      ) : (
        icon && <Feather name={icon} size={16} color={secondary ? colors.primary : "white"} />
      )}
      <Text
        style={{
          fontWeight: "700",
          fontSize: 13,
          color: secondary ? colors.primary : "white",
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
  return (
    <View style={{ gap: 0, flexGrow: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TextInput
          accessibilityLabel={label}
          value={value || ""}
          onChangeText={onChange}
          secureTextEntry={password && !visible}
          multiline={multiline}
          placeholder={placeholder}
          placeholderTextColor="#8291aa"
          keyboardType={keyboardType}
          autoCapitalize={password || keyboardType === "email-address" ? "none" : "sentences"}
          autoCorrect={!password}
          editable={editable}
          style={[
            styles.input,
            {
              flex: 1,
              ...(multiline ? { minHeight: 90, textAlignVertical: "top" } : {}),
              ...(!editable ? { opacity: 0.6 } : {}),
            },
          ]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            onPress={() => setVisible(!visible)}
            style={{ padding: 12 }}
          >
            <Feather name={visible ? "eye-off" : "eye"} size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
export function Choices({ label, options, value, onChange }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, { gap: 8 }]}>
        {options.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: option === value }}
            onPress={() => onChange(option)}
            style={{
              paddingHorizontal: 13,
              paddingVertical: 11,
              borderWidth: 1,
              borderRadius: 9,
              borderColor: option === value ? colors.primary : colors.border,
              backgroundColor: option === value ? colors.softAccent : "white",
            }}
          >
            <Text
              style={{
                color: option === value ? colors.primary : colors.muted,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function Badge({ status }) {
  let tone = colors.primary;
  if (status === "Rejected") {
    tone = colors.red;
  } else if (status === "Pending Approval") {
    tone = colors.amber;
  } else if (status === "Exited") {
    tone = colors.muted;
  }
  return (
    <View
      style={{
        backgroundColor: `${tone}12`,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: tone, fontSize: 11, fontWeight: "700" }}>{status}</Text>
    </View>
  );
}
export function Empty({
  title = "Nothing here yet",
  detail = "New activity will appear here.",
  icon = "inbox",
}) {
  return (
    <View style={{ alignItems: "center", padding: 34, gap: 9 }}>
      <Feather name={icon} size={28} color={colors.muted} />
      <Text style={[styles.text, { fontWeight: "700" }]}>{title}</Text>
      <Text style={[styles.muted, { textAlign: "center" }]}>{detail}</Text>
    </View>
  );
}
export function Dialog({ title, children, onClose }) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#17243aaa",
          justifyContent: "center",
          alignItems: "center",
          padding: 18,
        }}
      >
        <View
          style={[styles.card, { width: "100%", maxWidth: 620, maxHeight: "92%", padding: 22 }]}
        >
          <View style={[styles.row, { justifyContent: "space-between" }]}>
            <Text style={[styles.title, { flex: 1 }]}>{title}</Text>
            <Button title="Close" secondary onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={{ gap: 18 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function Message({ text, error }) {
  return text ? (
    <View
      accessibilityRole="alert"
      style={{
        padding: 14,
        borderRadius: 10,
        backgroundColor: error ? "#fceced" : colors.softAccent,
      }}
    >
      <Text
        style={{
          color: error ? colors.red : colors.primary,
          fontSize: 13,
          lineHeight: 20,
        }}
      >
        {text}
      </Text>
    </View>
  ) : null;
}
export const date = (value) => (value ? new Date(value).toLocaleString() : "—");
