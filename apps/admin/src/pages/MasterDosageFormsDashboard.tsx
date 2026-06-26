import MasterReferenceDashboard from "./MasterReferenceDashboard";

export default function MasterDosageFormsDashboard() {
  return (
    <MasterReferenceDashboard
      title="Dosage Forms"
      description="Live dosage_form_master rows populated from normalized medicine records."
      resource="dosage-forms"
      searchPlaceholder="Search dosage forms..."
      statusOptions={["PENDING_REVIEW", "ACTIVE", "INACTIVE"]}
      approvalStatusOptions={["PENDING", "APPROVED", "REJECTED"]}
      columns={[
        { label: "Name", render: (item) => item.name },
        { label: "Normalized", render: (item) => item.normalizedName },
        { label: "Linked", render: (item) => String(item.linkedRegistrations ?? 0) },
        { label: "Status", render: (item) => item.status },
      ]}
      detailFields={[
        { label: "Normalized", render: (item) => item.normalizedName },
        { label: "Approval", render: (item) => item.approvalStatus || "-" },
      ]}
    />
  );
}
