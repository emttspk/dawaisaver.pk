export default function HelpFaq() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">Help and FAQ</h1>
      {[
        ["What does equivalent mean?", "Equivalent options use the same active ingredient, strength, and dosage form when the backend has enough evidence."],
        ["Can I switch medicine based on this app?", "No. Use DawaiSaver.pk to discuss options with a doctor or pharmacist, especially for high-risk medicines."],
        ["Which medicines are high risk?", "The beta flags insulin, thyroid medicines, anti-epilepsy medicines, blood thinners, cancer medicines, psychiatric medicines, steroids, pregnancy-related medicines, and controlled medicines."],
        ["Why does a result need review?", "A result may need review when confidence is low, source evidence is missing, or a high-risk warning is detected."],
        ["What happens to uploads?", "Uploads are sent to the backend OCR flow and stored through the configured Cloudflare R2 storage path."],
      ].map(([question, answer]) => (
        <section key={question} className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">{question}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
        </section>
      ))}
    </div>
  );
}
