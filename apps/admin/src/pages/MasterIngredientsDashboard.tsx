import MasterReferenceDashboard from "./MasterReferenceDashboard";

export default function MasterIngredientsDashboard() {
  return (
    <MasterReferenceDashboard
      title="Ingredients"
      description="Live ingredient_master rows built from normalized compositions."
      resource="ingredients"
      searchPlaceholder="Search ingredients..."
      statusOptions={["PENDING_REVIEW", "ACTIVE", "INACTIVE"]}
      approvalStatusOptions={["PENDING", "APPROVED", "REJECTED"]}
      columns={[
        { label: "Name", render: (item) => item.name },
        { label: "WHO", render: (item) => item.whoCode || (item.whoMatched ? "Matched" : "-") },
        { label: "Linked", render: (item) => String(item.linkedRegistrations ?? 0) },
        { label: "Status", render: (item) => item.status },
      ]}
      detailFields={[
        { label: "Normalized", render: (item) => item.normalizedName },
        { label: "WHO code", render: (item) => item.whoCode || "-" },
        { label: "Approval", render: (item) => item.approvalStatus || "-" },
      ]}
    />
  );
}
