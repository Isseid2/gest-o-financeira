export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#f8fafc,#eef2ff_55%,#ffffff)] px-4">
      <div className="rounded-[28px] border border-slate-200 bg-white/90 px-8 py-7 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
        <p className="mt-5 text-sm font-medium text-slate-700">{label}</p>
      </div>
    </div>
  );
}
