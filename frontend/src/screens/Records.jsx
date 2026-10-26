import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { api } from "../api";
import { Badge, Button, Choices, Dialog, Empty, Field, Message, date, styles } from "../ui";
import { useOrganization } from "../organization";
import { availablePage } from "../records.mjs";
import { useLoad } from "../hooks/useLoad";
import { Heading, LoadState, RecordCard } from "../components/ScreenElements";
export function Records({ mode, user }) {
  const { historyGates } = useOrganization();

  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("All");
  const [gate, setGate] = useState("All gates");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [exitEquipment, setExitEquipment] = useState("");
  const [exitNotes, setExitNotes] = useState("");
  let status = "";
  if (mode === "Approvals") {
    status = "pending";
  } else if (mode === "Vehicle exit" || filter === "Inside") {
    status = "inside";
  } else if (filter === "Pending") {
    status = "pending";
  }

  let subtitle = "A complete history of arrivals, approvals and departures.";
  if (mode === "Approvals") {
    subtitle = "Review equipment requests for your permitted department.";
  } else if (mode === "Vehicle exit") {
    subtitle = "Select a vehicle, verify equipment, and confirm departure.";
  }
  const gateQuery = gate === "All gates" ? "" : `&gate=${encodeURIComponent(gate)}`;
  const query = `status=${status}&search=${encodeURIComponent(submittedSearch)}${gateQuery}`;
  const syncPage = useCallback((result) => {
    setPage((current) => availablePage(current, result.pages));
  }, []);
  const recordsState = useLoad(`/vehicleRecord?${query}&page=${page}`, syncPage);
  async function updateRecord(path, body) {
    setBusy(true);
    setError("");
    try {
      await api(path, "PUT", body);
      setSelectedRecord(null);
      setMessage("Record updated successfully.");
      if (page !== 1) setPage(1);
      else await recordsState.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function openRecord(item) {
    setSelectedRecord(item);
    setExitEquipment("");
    setExitNotes("");
    setError("");
  }
  return (
    <>
      <Heading
        title={mode}
        subtitle={subtitle}
        action={
          <Button
            title="Refresh"
            icon="refresh-cw"
            secondary
            onPress={recordsState.reload}
            busy={recordsState.loading}
          />
        }
      />
      <Message text={message} />
      <Message text={!selectedRecord ? error : ""} error />
      <View style={styles.card}>
        <View style={styles.row}>
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
              setSubmittedSearch(search);
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
        <LoadState state={recordsState} />
        <Text style={styles.muted}>{recordsState.data?.total ?? "—"} matching movements</Text>
        {!recordsState.loading && !recordsState.error && recordsState.data?.items.length === 0 && (
          <Empty
            title={
              mode === "Approvals" && recordsState.data.total === 0
                ? "You’re all caught up"
                : "No matching movements"
            }
            detail="Try another search or refresh to check for new activity."
          />
        )}
        {recordsState.data?.items.map((item) => (
          <RecordCard key={item.passId} item={item} onOpen={openRecord} />
        ))}
        <View
          style={[
            styles.row,
            {
              justifyContent: "space-between",
            },
          ]}
        >
          <Button
            title="Previous"
            secondary
            disabled={page <= 1 || recordsState.loading}
            onPress={() => setPage(page - 1)}
          />
          <Text style={styles.muted}>
            Page {page} of {Math.max(1, recordsState.data?.pages || 1)}
          </Text>
          <Button
            title="Next"
            secondary
            disabled={!recordsState.data || page >= recordsState.data.pages || recordsState.loading}
            onPress={() => setPage(page + 1)}
          />
        </View>
      </View>
      {selectedRecord && (
        <Dialog
          title={selectedRecord.vehicleNumber}
          onClose={() => !busy && setSelectedRecord(null)}
        >
          <Badge status={selectedRecord.outTime ? "Exited" : selectedRecord.approvalStatus} />
          <Message text={error} error />
          {[
            ["Driver", selectedRecord.driverName],
            ["Phone", selectedRecord.driverPhone],
            ["Identity number", selectedRecord.driverIdentity],
            ["Department", selectedRecord.department],
            ["Entry", `${date(selectedRecord.inTime)} · ${selectedRecord.entryGate}`],
            ["Equipment", selectedRecord.carriedEquipment || "None declared"],
            ["Entry notes", selectedRecord.entryNotes || "—"],
            ["Approved / reviewed by", selectedRecord.authorizedBy || "—"],
            ["Pass ID", selectedRecord.gatePassNumber || selectedRecord.passId],
            [
              "Departure",
              selectedRecord.outTime
                ? `${date(selectedRecord.outTime)} · ${selectedRecord.exitGate}`
                : "Still inside",
            ],
            ["Exit equipment verification", selectedRecord.exitEquipment || "—"],
            ["Exit notes", selectedRecord.exitNotes || "—"],
          ].map(([label, value]) => (
            <View key={label}>
              <Text style={styles.label}>{label}</Text>
              <Text selectable style={styles.text}>
                {value}
              </Text>
            </View>
          ))}
          {user.role !== "security" &&
            selectedRecord.approvalStatus === "Pending Approval" &&
            !selectedRecord.outTime && (
              <View style={styles.row}>
                <Button
                  title="Approve equipment"
                  icon="check"
                  busy={busy}
                  onPress={() =>
                    updateRecord(`/vehicleRecord/status/${selectedRecord.passId}`, {
                      status: "Approved",
                    })
                  }
                />
                <Button
                  title="Reject request"
                  danger
                  busy={busy}
                  onPress={() =>
                    updateRecord(`/vehicleRecord/status/${selectedRecord.passId}`, {
                      status: "Rejected",
                    })
                  }
                />
              </View>
            )}
          {user.role === "security" && !selectedRecord.outTime && (
            <>
              <View style={styles.divider} />
              <Text style={styles.title}>Departure verification</Text>
              <Field
                label="Equipment verification"
                value={exitEquipment}
                onChange={setExitEquipment}
                placeholder="Record items checked against the approved pass"
                multiline
              />
              <Field label="Exit notes" value={exitNotes} onChange={setExitNotes} multiline />
              {selectedRecord.approvalStatus !== "Approved" && (
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
                  selectedRecord.approvalStatus !== "Approved" ||
                  (!!selectedRecord.carriedEquipment && !exitEquipment.trim())
                }
                onPress={() =>
                  updateRecord(
                    `/vehicleRecord/${encodeURIComponent(selectedRecord.vehicleNumber)}`,
                    {
                      passId: selectedRecord.passId,
                      exitEquipment,
                      exitNotes,
                    },
                  )
                }
              />
              {selectedRecord.approvalStatus === "Rejected" && (
                <Button
                  title="Resubmit for review"
                  secondary
                  busy={busy}
                  onPress={() =>
                    updateRecord(`/vehicleRecord/resubmit/${selectedRecord.passId}`, {
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
