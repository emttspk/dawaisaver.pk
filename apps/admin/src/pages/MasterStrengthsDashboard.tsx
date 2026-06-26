import MasterReferenceDashboard from "./MasterReferenceDashboard";

export default function MasterStrengthsDashboard() {
  return (
    <MasterReferenceDashboard
      title="Strengths"
      description="Live strength_master rows derived from normalized composition strengths."
      resource="strengths"
      searchPlaceholder="Search strengths..."
      statusOptions={["PENDING_REVIEW", "ACTIVE", "INACTIVE"]}
      approvalStatusOptions={["PENDING", "APPROVED", "REJECTED"]}
      columns={[
        { label: "Value", render: (item) => item.value || item.normalizedValue },
        { label: "Unit", render: (item) => item.unit || "-" },
        { label: "Linked", render: (item) => String(item.linkedRegistrations ?? 0) },
        { label: "Status", render: (item) => item.status },
      ]}
      detailFields={[
        { label: "Normalized", render: (item) => item.normalizedValue },
        { label: "Approval", render: (item) => item.approvalStatus || "-" },
      ]}
    />
  );
}
