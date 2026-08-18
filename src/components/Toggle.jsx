export function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] whitespace-nowrap font-bold text-brand-10/60 uppercase w-28">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
          checked ? 'bg-brand-30' : 'bg-brand-60/40'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </button>
    </div>
  );
}
