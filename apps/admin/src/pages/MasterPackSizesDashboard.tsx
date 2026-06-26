import MasterReferenceDashboard from "./MasterReferenceDashboard";

export default function MasterPackSizesDashboard() {
  return (
    <MasterReferenceDashboard
      title="Pack Sizes"
      description="Live pack_master rows normalized from the stored medicine pack strings."
      resource="packs"
      searchPlaceholder="Search pack sizes..."
      statusOptions={["PENDING_REVIEW", "ACTIVE", "INACTIVE"]}
      approvalStatusOptions={["PENDING", "APPROVED", "REJECTED"]}
      columns={[
        { label: "Label", render: (item) => item.normalizedPackLabel || item.name },
        { label: "Units", render: (item) => item.unitCount ?? "-" },
        { label: "Type", render: (item) => item.unitType || "-" },
        { label: "Linked", render: (item) => String(item.linkedRegistrations ?? 0) },
      ]}
      detailFields={[
        { label: "Label", render: (item) => item.normalizedPackLabel || item.name },
        { label: "Volume", render: (item) => item.volumeMl || "-" },
        { label: "Weight", render: (item) => item.weightG || "-" },
        { label: "Approval", render: (item) => item.approvalStatus || "-" },
      ]}
    />
  );
}
