import MasterReferenceDashboard from "./MasterReferenceDashboard";

export default function MasterApplicantsDashboard() {
  return (
    <MasterReferenceDashboard
      title="Applicants"
      description="Live applicant_master rows linked back to the same normalized medicine records."
      resource="applicants"
      searchPlaceholder="Search applicants..."
      statusOptions={["PENDING_REVIEW", "ACTIVE", "INACTIVE"]}
      approvalStatusOptions={["PENDING", "APPROVED", "REJECTED"]}
      columns={[
        { label: "Name", render: (item) => item.name },
        { label: "Country", render: (item) => item.country || "-" },
        { label: "Linked", render: (item) => String(item.linkedRegistrations ?? 0) },
        { label: "Status", render: (item) => item.status },
      ]}
      detailFields={[
        { label: "Normalized", render: (item) => item.normalizedName },
        { label: "Country", render: (item) => item.country || "-" },
        { label: "Approval", render: (item) => item.approvalStatus || "-" },
      ]}
    />
  );
}
