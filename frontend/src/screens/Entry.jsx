import { useState } from "react";
import { Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { api } from "../api";
import { Button, Choices, Field, Message, styles, colors } from "../ui";
import { useOrganization } from "../organization";
import { Heading } from "../components/ScreenElements";

export function Entry({ user }) {
  const { departments } = useOrganization();
  const blankEntry = {
    vehicleNumber: "",
    driverName: "",
    driverIdentity: "",
    driverPhone: "",
    department: departments[0] || "Operations",
    carriedEquipment: "",
    entryNotes: "",
  };

  const [form, setForm] = useState({ ...blankEntry });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function submit() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api("/vehicleRecord", "POST", form);
      setForm({ ...blankEntry });
      const approvalNotice =
        result.approvalStatus === "Pending Approval"
          ? "Equipment declared — manager approval is required before departure."
          : "Vehicle is now cleared inside.";
      setMessage(`Arrival logged for ${result.vehicleNumber}. ${approvalNotice}`);
    } catch (e) {
      setError(e.message || "Failed to record vehicle arrival.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading
        title="Check-In Vehicle"
        subtitle={`Station: ${user.gate || "Main Gate"} · Duty Officer: ${user.name}`}
      />

      <Message text={error} error />
      <Message text={message} />

      <View style={[styles.card, { maxWidth: 860, padding: 30, gap: 22 }]}>
        {/* Section 1: Vehicle & Driver Identity */}
        <View style={{ gap: 14 }}>
          <View style={[styles.row, { gap: 8, alignItems: "center" }]}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.softAccent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: colors.primary }}>1</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.ink }}>
              Vehicle & Driver Identity
            </Text>
          </View>

          <View style={[styles.row, { alignItems: "flex-start", gap: 16 }]}>
            <View style={{ flex: 1, minWidth: 240, gap: 14 }}>
              <Field
                label="License Plate / Vehicle Number *"
                value={form.vehicleNumber}
                onChange={(val) => change("vehicleNumber", val)}
                placeholder="e.g. KA-01-AB-1234"
              />
              <Field
                label="Driver Full Name *"
                value={form.driverName}
                onChange={(val) => change("driverName", val)}
                placeholder="Driver or visitor name"
              />
            </View>

            <View style={{ flex: 1, minWidth: 240, gap: 14 }}>
              <Field
                label="Driver Mobile Number"
                value={form.driverPhone}
                onChange={(val) => change("driverPhone", val)}
                keyboardType="phone-pad"
                placeholder="+1 (555) 000-0000"
              />
              <Field
                label="ID / Driver License Number"
                value={form.driverIdentity}
                onChange={(val) => change("driverIdentity", val)}
                placeholder="Government or Visitor ID"
              />
            </View>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.border }} />

        {/* Section 2: Destination & Equipment */}
        <View style={{ gap: 14 }}>
          <View style={[styles.row, { gap: 8, alignItems: "center" }]}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.softAccent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: colors.primary }}>2</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.ink }}>
              Destination & Carried Equipment
            </Text>
          </View>

          <Choices
            label="Destination Department *"
            options={
              departments.length ? departments : ["Operations", "Engineering", "Administration"]
            }
            value={form.department}
            onChange={(val) => change("department", val)}
          />

          <Field
            label="Declared Carried Equipment (Leave blank if none)"
            value={form.carriedEquipment}
            onChange={(val) => change("carriedEquipment", val)}
            placeholder="e.g. 2 Laptops (Dell S/N: 4892, 4893), 1 Tool kit"
            multiline
          />

          <Field
            label="Visit Remarks / Purpose"
            value={form.entryNotes}
            onChange={(val) => change("entryNotes", val)}
            placeholder="Reason for campus entry or cargo details"
          />

          {/* Policy Callout Banner */}
          <View
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: colors.softAccent,
              borderWidth: 1,
              borderColor: "rgba(37, 99, 235, 0.2)",
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Feather name="shield" size={18} color={colors.primary} />
            <Text
              style={{
                fontSize: 12,
                color: colors.primaryDark,
                lineHeight: 18,
                flex: 1,
                fontWeight: "500",
              }}
            >
              Declaring equipment will automatically lock the vehicle from exiting until the
              department manager authorizes the pass.
            </Text>
          </View>
        </View>

        {/* Submit */}
        <Button
          title="Authenticate & Confirm Entry"
          icon="check-circle"
          onPress={submit}
          busy={busy}
          disabled={!form.vehicleNumber.trim() || !form.driverName.trim()}
        />
      </View>
    </>
  );
}
