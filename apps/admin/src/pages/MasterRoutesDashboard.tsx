import MasterReferenceDashboard from "./MasterReferenceDashboard";

export default function MasterRoutesDashboard() {
  return (
    <MasterReferenceDashboard
      title="Routes"
      description="Live route_master rows populated from normalized route-of-administration values."
      resource="routes"
      searchPlaceholder="Search routes..."
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
