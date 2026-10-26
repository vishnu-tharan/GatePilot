import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { api } from "../api";
import { Badge, Button, Choices, Dialog, Empty, Field, Message, date, s } from "../ui";
import { useOrganization } from "../organization";
import { availablePage } from "../records.mjs";
import { useLoad } from "../hooks/useLoad";
import { Heading, LoadState, RecordCard } from "../components/ScreenElements";
export function Records({ mode, user }) {
  const { historyGates } = useOrganization();

  const [search, setSearch] = useState(""),
    [committed, setCommitted] = useState(""),
    [page, setPage] = useState(1),
    [filter, setFilter] = useState("All"),
    [gate, setGate] = useState("All gates"),
    [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [exitEquipment, setExitEquipment] = useState(""),
    [exitNotes, setExitNotes] = useState("");
  const status =
    mode === "Approvals"
      ? "pending"
      : mode === "Vehicle exit" || filter === "Inside"
        ? "inside"
        : filter === "Pending"
          ? "pending"
          : "";
  const gateQuery = gate === "All gates" ? "" : `&gate=${encodeURIComponent(gate)}`;
  const query = `status=${status}&search=${encodeURIComponent(committed)}${gateQuery}`;
  const syncPage = useCallback((result) => {
    setPage((current) => availablePage(current, result.pages));
  }, []);
  const state = useLoad(`/vehicleRecord?${query}&page=${page}`, syncPage);
  async function mutate(path, body) {
    setBusy(true);
    setError("");
    try {
      await api(path, "PUT", body);
      setSelected(null);
      setMessage("Record updated successfully.");
      if (page !== 1) setPage(1);
      else await state.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function open(item) {
    setSelected(item);
    setExitEquipment("");
    setExitNotes("");
    setError("");
  }
  return (
    <>
      <Heading
        title={mode}
        subtitle={
          mode === "Approvals"
            ? "Review equipment requests for your permitted department."
            : mode === "Vehicle exit"
              ? "Select a vehicle, verify equipment, and confirm departure."
              : "A complete history of arrivals, approvals and departures."
        }
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
      <Message text={message} />
      <Message text={!selected ? error : ""} error />
      <View style={s.card}>
        <View style={s.row}>
          <Field
            label="Search movements"
            placeholder="Vehicle, driver or pass number"
            value={search}
            onChange={setSearch}
          />
          <Button
            title="Search"
            icon="search"
            secondary
            onPress={() => {
              setCommitted(search);
              setPage(1);
            }}
          />
        </View>
        {mode === "Vehicle records" && (
          <Choices
            label="Show"
            options={["All", "Inside", "Pending"]}
            value={filter}
            onChange={(value) => {
              setFilter(value);
              setPage(1);
            }}
          />
        )}
        <Choices
          label="Arrival gate"
          options={["All gates", ...historyGates]}
          value={gate}
          onChange={(value) => {
            setGate(value);
            setPage(1);
          }}
        />
        <LoadState state={state} />
        <Text style={s.muted}>{state.data?.total ?? "—"} matching movements</Text>
        {!state.loading && !state.error && state.data?.items.length === 0 && (
          <Empty
            title={
              mode === "Approvals" && state.data.total === 0
                ? "You’re all caught up"
                : "No matching movements"
            }
            detail="Try another search or refresh to check for new activity."
          />
        )}
        {state.data?.items.map((item) => (
          <RecordCard key={item.passId} item={item} onOpen={open} />
        ))}
        <View
          style={[
            s.row,
            {
              justifyContent: "space-between",
            },
          ]}
        >
          <Button
            title="Previous"
            secondary
            disabled={page <= 1 || state.loading}
            onPress={() => setPage(page - 1)}
          />
          <Text style={s.muted}>
            Page {page} of {Math.max(1, state.data?.pages || 1)}
          </Text>
          <Button
            title="Next"
            secondary
            disabled={!state.data || page >= state.data.pages || state.loading}
            onPress={() => setPage(page + 1)}
          />
        </View>
      </View>
      {selected && (
        <Dialog title={selected.vehicleNumber} onClose={() => !busy && setSelected(null)}>
          <Badge status={selected.outTime ? "Exited" : selected.approvalStatus} />
          <Message text={error} error />
          {[
            ["Driver", selected.driverName],
            ["Phone", selected.driverPhone],
            ["Identity number", selected.driverIdentity],
            ["Department", selected.department],
            ["Entry", `${date(selected.inTime)} · ${selected.entryGate}`],
            ["Equipment", selected.carriedEquipment || "None declared"],
            ["Entry notes", selected.entryNotes || "—"],
            ["Approved / reviewed by", selected.authorizedBy || "—"],
            ["Pass ID", selected.gatePassNumber || selected.passId],
            [
              "Departure",
              selected.outTime
                ? `${date(selected.outTime)} · ${selected.exitGate}`
                : "Still inside",
            ],
            ["Exit equipment verification", selected.exitEquipment || "—"],
            ["Exit notes", selected.exitNotes || "—"],
          ].map(([label, value]) => (
            <View key={label}>
              <Text style={s.label}>{label}</Text>
              <Text selectable style={s.text}>
                {value}
              </Text>
            </View>
          ))}
          {user.role !== "security" &&
            selected.approvalStatus === "Pending Approval" &&
            !selected.outTime && (
              <View style={s.row}>
                <Button
                  title="Approve equipment"
                  icon="check"
                  busy={busy}
                  onPress={() =>
                    mutate(`/vehicleRecord/status/${selected.passId}`, {
                      status: "Approved",
                    })
                  }
                />
                <Button
                  title="Reject request"
                  danger
                  busy={busy}
                  onPress={() =>
                    mutate(`/vehicleRecord/status/${selected.passId}`, {
                      status: "Rejected",
                    })
                  }
                />
              </View>
            )}
          {user.role === "security" && !selected.outTime && (
            <>
              <View style={s.divider} />
              <Text style={s.title}>Departure verification</Text>
              <Field
                label="Equipment verification"
                value={exitEquipment}
                onChange={setExitEquipment}
                placeholder="Record items checked against the approved pass"
                multiline
              />
              <Field label="Exit notes" value={exitNotes} onChange={setExitNotes} multiline />
              {selected.approvalStatus !== "Approved" && (
                <Message
                  text="Exit is blocked until this equipment request is approved. A rejected request can be corrected and resubmitted."
                  error
                />
              )}
              <Button
                title="Confirm vehicle exit"
                icon="log-out"
                busy={busy}
                disabled={
                  selected.approvalStatus !== "Approved" ||
                  (!!selected.carriedEquipment && !exitEquipment.trim())
                }
                onPress={() =>
                  mutate(`/vehicleRecord/${encodeURIComponent(selected.vehicleNumber)}`, {
                    passId: selected.passId,
                    exitEquipment,
                    exitNotes,
                  })
                }
              />
              {selected.approvalStatus === "Rejected" && (
                <Button
                  title="Resubmit for review"
                  secondary
                  busy={busy}
                  onPress={() =>
                    mutate(`/vehicleRecord/resubmit/${selected.passId}`, {
                      entryNotes: exitNotes,
                    })
                  }
                />
              )}
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
