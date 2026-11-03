import { useCallback, useState } from "react";
import { Text, View, Pressable } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { api } from "../api";
import { Badge, Button, Choices, Dialog, Empty, Field, Message, date, styles, colors } from "../ui";
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

  let title = "Vehicle Access Ledger";
  let subtitle = "Search, filter, and inspect verified campus entries and departures.";
  if (mode === "Approvals") {
    title = "Equipment Approval Queue";
    subtitle = "Review declared equipment passes waiting for department clearance.";
  } else if (mode === "Vehicle exit") {
    title = "Vehicle Exit Clearance";
    subtitle = "Verify cargo against authorized passes before confirming departure.";
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
      setMessage("Record successfully updated.");
      if (page !== 1) setPage(1);
      else await recordsState.reload();
    } catch (e) {
      setError(e.message || "Failed to update record.");
    } finally {
      setBusy(false);
    }
  }

  function openRecord(item) {
    setSelectedRecord(item);
    setExitEquipment(item.exitEquipment || "");
    setExitNotes(item.exitNotes || "");
    setError("");
  }

  return (
    <>
      <Heading
        title={title}
        subtitle={subtitle}
        action={
          <Button
            title="Refresh Ledger"
            icon="refresh-cw"
            secondary
            small
            onPress={recordsState.reload}
            busy={recordsState.loading}
          />
        }
      />

      <Message text={message} />
      <Message text={!selectedRecord ? error : ""} error />

      <View style={[styles.card, { padding: 24, gap: 18 }]}>
        {/* Search Input Bar */}
        <View style={[styles.row, { gap: 10 }]}>
          <View style={{ flex: 1, minWidth: 260 }}>
            <Field
              label=""
              placeholder="Search by license plate, driver name, or pass code..."
              value={search}
              onChange={setSearch}
            />
          </View>
          <Button
            title="Search"
            icon="search"
            secondary
            onPress={() => {
              setSubmittedSearch(search);
              setPage(1);
            }}
          />
          {submittedSearch ? (
            <Button
              title="Reset"
              secondary
              onPress={() => {
                setSearch("");
                setSubmittedSearch("");
                setPage(1);
              }}
            />
          ) : null}
        </View>

        {/* Filter Controls */}
        <View
          style={[
            styles.row,
            {
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: "#f1f5f9",
            },
          ]}
        >
          {mode === "Vehicle records" ? (
            <View style={[styles.row, { gap: 6 }]}>
              {["All", "Inside", "Pending"].map((tabName) => {
                const isSelected = filter === tabName;
                return (
                  <Pressable
                    key={tabName}
                    onPress={() => {
                      setFilter(tabName);
                      setPage(1);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: isSelected ? colors.softAccent : "#f8fafc",
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isSelected ? "700" : "500",
                        color: isSelected ? colors.primary : colors.inkSecondary,
                      }}
                    >
                      {tabName === "All"
                        ? "All Movements"
                        : tabName === "Inside"
                          ? "Currently Inside"
                          : "Pending Approval"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View />
          )}

          <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>
            Total: {recordsState.data?.total ?? 0} visits
          </Text>
        </View>

        {/* Gate Filter Chips */}
        <Choices
          label="Filter by Checkpoint Gate"
          options={["All gates", ...historyGates]}
          value={gate}
          onChange={(val) => {
            setGate(val);
            setPage(1);
          }}
        />

        <LoadState state={recordsState} />

        {/* Empty State */}
        {!recordsState.loading && recordsState.data?.items?.length === 0 && (
          <Empty
            title={mode === "Approvals" ? "Approval Queue Cleared" : "No Matching Visits Found"}
            detail={
              mode === "Approvals"
                ? "No equipment approvals are waiting for review right now."
                : "No vehicle interactions match the current search or filters."
            }
          />
        )}

        {/* Record Cards */}
        <View style={{ gap: 10 }}>
          {recordsState.data?.items?.map((item) => (
            <RecordCard key={item.passId} item={item} onOpen={openRecord} />
          ))}
        </View>

        {/* Pagination Bar */}
        <View
          style={[
            styles.row,
            {
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Button
            title="Previous"
            secondary
            small
            disabled={page <= 1 || recordsState.loading}
            onPress={() => setPage(page - 1)}
          />
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>
            Page {page} of {recordsState.data?.pages || 1}
          </Text>
          <Button
            title="Next"
            secondary
            small
            disabled={!recordsState.data || page >= recordsState.data.pages || recordsState.loading}
            onPress={() => setPage(page + 1)}
          />
        </View>
      </View>

      {/* Digital Gate Pass Modal */}
      {selectedRecord && (
        <Dialog
          title={`Gate Pass: ${selectedRecord.vehicleNumber}`}
          onClose={() => !busy && setSelectedRecord(null)}
        >
          <View
            style={[
              styles.row,
              {
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={[styles.row, { gap: 6, alignItems: "center" }]}>
              <Feather name="hash" size={14} color={colors.muted} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  fontFamily: "monospace",
                  color: colors.ink,
                }}
              >
                {selectedRecord.gatePassNumber || selectedRecord.passId.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <Badge status={selectedRecord.outTime ? "Exited" : selectedRecord.approvalStatus} />
          </View>

          <Message text={error} error />

          {/* Clean Receipt-Style Metadata Table */}
          <View
            style={{
              gap: 12,
              backgroundColor: "#f8fafc",
              padding: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {[
              ["Driver / Visitor", selectedRecord.driverName],
              ["Contact Phone", selectedRecord.driverPhone || "Not provided"],
              ["Destination Dept", selectedRecord.department],
              ["Entry Checkpoint", `${date(selectedRecord.inTime)} (${selectedRecord.entryGate})`],
              [
                "Exit Clearance",
                selectedRecord.outTime
                  ? `${date(selectedRecord.outTime)} (${selectedRecord.exitGate || "Gate"})`
                  : "Currently on campus",
              ],
              ["Carried Equipment", selectedRecord.carriedEquipment || "None declared"],
              ["Authorized By", selectedRecord.authorizedBy || "Automatic / None required"],
              ["Entry Notes", selectedRecord.entryNotes || "None"],
              ["Exit Remarks", selectedRecord.exitNotes || "None"],
            ].map(([label, val]) => (
              <View
                key={label}
                style={[styles.row, { justifyContent: "space-between", alignItems: "flex-start" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, width: 130 }}>
                  {label}
                </Text>
                <Text
                  selectable
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.ink,
                    flex: 1,
                    textAlign: "right",
                  }}
                >
                  {val}
                </Text>
              </View>
            ))}
          </View>

          {/* Department Manager Approval Action Buttons */}
          {user.role !== "security" &&
            selectedRecord.approvalStatus === "Pending Approval" &&
            !selectedRecord.outTime && (
              <View style={{ gap: 12, marginTop: 4 }}>
                <Text style={styles.sectionTitle}>Manager Decision</Text>
                <View style={[styles.row, { gap: 10 }]}>
                  <Button
                    title="Approve Equipment Pass"
                    icon="check"
                    success
                    busy={busy}
                    onPress={() =>
                      updateRecord(`/vehicleRecord/status/${selectedRecord.passId}`, {
                        status: "Approved",
                      })
                    }
                  />
                  <Button
                    title="Reject Request"
                    icon="x"
                    danger
                    busy={busy}
                    onPress={() =>
                      updateRecord(`/vehicleRecord/status/${selectedRecord.passId}`, {
                        status: "Rejected",
                      })
                    }
                  />
                </View>
              </View>
            )}

          {/* Security Officer Departure Check */}
          {user.role === "security" && !selectedRecord.outTime && (
            <View
              style={{
                gap: 14,
                marginTop: 6,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "800", color: colors.ink }}>
                Exit Verification & Checkpoint Clearance
              </Text>

              {selectedRecord.carriedEquipment ? (
                <Field
                  label="Verified Exit Equipment (Serial Numbers & Count) *"
                  value={exitEquipment}
                  onChange={setExitEquipment}
                  placeholder="Record serial numbers / equipment verified before gate opening"
                  multiline
                />
              ) : null}

              <Field
                label="Exit Remarks / Observations"
                value={exitNotes}
                onChange={setExitNotes}
                placeholder="Optional gate notes"
              />

              {selectedRecord.approvalStatus !== "Approved" && (
                <Message
                  text="Departure is blocked. Carried equipment must be authorized by the department manager before exit clearance."
                  error
                />
              )}

              <Button
                title="Confirm Departure & Close Visit"
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
                  title="Resubmit Corrected Request"
                  secondary
                  busy={busy}
                  onPress={() =>
                    updateRecord(`/vehicleRecord/resubmit/${selectedRecord.passId}`, {
                      entryNotes: exitNotes,
                    })
                  }
                />
              )}
            </View>
          )}
        </Dialog>
      )}
    </>
  );
}
