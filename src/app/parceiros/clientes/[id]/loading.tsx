export default function ParceirosClienteOverviewLoading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b1720] px-5 py-8 font-['Rethink_Sans',sans-serif] text-[#f3f4f7] lg:px-6 lg:py-[74px]">
      <div className="mx-auto grid max-w-[1202px] gap-5">
        <div className="h-40 animate-pulse rounded-[16px] border border-[#303746] bg-[#181d25]" />
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="h-28 animate-pulse rounded-[12px] border border-[#303746] bg-[#181d25]" key={index} />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="h-80 animate-pulse rounded-[12px] border border-[#303746] bg-[#181d25]" />
          <div className="h-80 animate-pulse rounded-[12px] border border-[#303746] bg-[#181d25]" />
        </div>
      </div>
    </div>
  );
}
