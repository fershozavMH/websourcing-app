export default function StatCard({
  label,
  value,
  accent = 'slate',
}: {
  label: string;
  value: number | string;
  accent?: 'slate' | 'orange' | 'red';
}) {
  const accentClass =
    accent === 'orange' ? 'text-orange-600' : accent === 'red' ? 'text-red-600' : 'text-slate-800';

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-3xl font-black mt-2 ${accentClass}`}>{value}</p>
    </div>
  );
}
