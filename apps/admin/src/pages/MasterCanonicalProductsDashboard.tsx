import MasterReferenceDashboard from "./MasterReferenceDashboard";

export default function MasterCanonicalProductsDashboard() {
  return (
    <MasterReferenceDashboard
      title="Canonical Products"
      description="Live canonical_products rows mapped from normalized medicine signatures."
      resource="canonical-products"
      searchPlaceholder="Search canonical products..."
      statusOptions={["PENDING_REVIEW", "ACTIVE", "INACTIVE"]}
      approvalStatusOptions={["PENDING", "APPROVED", "REJECTED"]}
      columns={[
        { label: "Canonical", render: (item) => item.canonicalName },
        { label: "Signature", render: (item) => item.medicineSignature },
        { label: "Brand", render: (item) => item.normalizedBrand },
        { label: "Status", render: (item) => item.status },
      ]}
      detailFields={[
        { label: "Generic", render: (item) => item.normalizedGeneric },
        { label: "Strength", render: (item) => item.normalizedStrength || "-" },
        { label: "Dosage", render: (item) => item.normalizedDosageForm || "-" },
        { label: "Approval", render: (item) => item.approvalStatus || "-" },
      ]}
    />
  );
}
