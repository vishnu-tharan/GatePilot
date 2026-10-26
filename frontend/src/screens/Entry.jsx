import { useState } from "react";
import { Text, View } from "react-native";
import { api } from "../api";
import { Button, Choices, Field, Message, styles } from "../ui";
import { useOrganization } from "../organization";
import { Heading } from "../components/ScreenElements";
export function Entry({ user }) {
  const { departments } = useOrganization();
  const blankEntry = {
    vehicleNumber: "",
    driverName: "",
    driverIdentity: "",
    driverPhone: "",
    department: departments[0] || "",
    carriedEquipment: "",
    entryNotes: "",
  };

  const [form, setForm] = useState({
    ...blankEntry,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (key, value) =>
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  async function submit() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api("/vehicleRecord", "POST", form);
      setForm({
        ...blankEntry,
      });
      setMessage(
        `Arrival recorded for ${result.vehicleNumber}. ${result.approvalStatus === "Pending Approval" ? "Equipment approval is now required before exit." : "Vehicle is now inside."}`,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading title="Record an arrival" subtitle={`You’re recording entry at ${user.gate}.`} />
      <Message text={error} error />
      <Message text={message} />
      <View
        style={[
          styles.card,
          {
            maxWidth: 850,
          },
        ]}
      >
        <Text style={styles.title}>Vehicle & visitor details</Text>
        <View
          style={[
            styles.row,
            {
              alignItems: "flex-start",
            },
          ]}
        >
          <View
            style={{
              flex: 1,
              minWidth: 220,
              gap: 18,
            }}
          >
            <Field
              label="Vehicle number *"
              value={form.vehicleNumber}
              onChange={(value) => change("vehicleNumber", value)}
              placeholder="DEMO-005"
            />
            <Field
              label="Driver name *"
              value={form.driverName}
              onChange={(value) => change("driverName", value)}
            />
            <Field
              label="Visitor identity number *"
              value={form.driverIdentity}
              onChange={(value) => change("driverIdentity", value)}
            />
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 220,
              gap: 18,
            }}
          >
            <Field
              label="Phone number *"
              value={form.driverPhone}
              onChange={(value) => change("driverPhone", value)}
              keyboardType="phone-pad"
            />
            <Field
              label="Carried equipment"
              value={form.carriedEquipment}
              onChange={(value) => change("carriedEquipment", value)}
              placeholder="Describe items, quantities and serial numbers"
              multiline
            />
          </View>
        </View>
        <Choices
          label="Destination department *"
          options={departments}
          value={form.department}
          onChange={(value) => change("department", value)}
        />
        <Field
          label="Entry notes"
          value={form.entryNotes}
          onChange={(value) => change("entryNotes", value)}
          multiline
        />
        <Text style={styles.muted}>
          Equipment entries require department approval. Entry time and your gate are recorded
          automatically.
        </Text>
        <Button
          title="Confirm vehicle entry"
          icon="log-in"
          onPress={submit}
          busy={busy}
          disabled={["vehicleNumber", "driverName", "driverIdentity", "driverPhone"].some(
            (key) => !form[key].trim(),
          )}
        />
      </View>
    </>
  );
}
