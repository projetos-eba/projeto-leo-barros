export default function PartnerMaterialLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-[#0b1720] px-6 py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="h-10 w-72 rounded bg-[#142735]" />
        <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
          <div className="h-[680px] rounded-[8px] bg-[#12232f]" />
          <div className="space-y-4"><div className="h-64 rounded-[8px] bg-[#12232f]" /><div className="h-48 rounded-[8px] bg-[#12232f]" /></div>
        </div>
      </div>
    </div>
  );
}
