import MasterReferenceDashboard from "./MasterReferenceDashboard";

export default function MasterTherapeuticCategoriesDashboard() {
  return (
    <MasterReferenceDashboard
      title="Therapeutic Categories"
      description="Live therapeutic_category_master rows grouped from normalized medicine records."
      resource="therapeutic-categories"
      searchPlaceholder="Search therapeutic categories..."
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
