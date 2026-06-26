import MasterReferenceDashboard from "./MasterReferenceDashboard";

export default function MasterAtcDashboard() {
  return (
    <MasterReferenceDashboard
      title="ATC"
      description="Live atc_master rows normalized from existing ATC codes in medicine records."
      resource="atc-classifications"
      searchPlaceholder="Search ATC codes..."
      statusOptions={["PENDING_REVIEW", "ACTIVE", "INACTIVE"]}
      approvalStatusOptions={["PENDING", "APPROVED", "REJECTED"]}
      columns={[
        { label: "Code", render: (item) => item.code },
        { label: "Name", render: (item) => item.name || "-" },
        { label: "Linked", render: (item) => String(item.linkedRegistrations ?? 0) },
        { label: "Status", render: (item) => item.status },
      ]}
      detailFields={[
        { label: "Code", render: (item) => item.code },
        { label: "Approval", render: (item) => item.approvalStatus || "-" },
      ]}
    />
  );
}
