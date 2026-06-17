import { useAuth } from "../contexts/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">Profile</h1>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={user?.name || "Not set"} />
          <Field label="Email" value={user?.email || "Not available"} />
          <Field label="Role" value={user?.role || "USER"} />
          <Field label="Beta status" value="Active" />
        </dl>
      </section>
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        DawaiSaver.pk provides comparison intelligence, not medical advice. Always confirm substitutions with a licensed professional.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
