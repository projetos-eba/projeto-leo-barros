"use client";

export default function ParceirosClienteError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-[#0b1720] px-5 py-8 font-['Rethink_Sans',sans-serif] text-[#f3f4f7] lg:px-6 lg:py-[74px]">
      <section className="mx-auto max-w-[1197px] rounded-[14px] border border-[rgba(65,80,92,0.71)] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)] p-6 text-center shadow-[0_2px_4px_rgba(0,0,0,0.07)] sm:p-8">
        <h1 className="text-[22px] font-bold text-white">Não foi possível carregar este perfil</h1>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-5 text-[#8b92a3]">Tente novamente para continuar acessando as informações do Cliente.</p>
        <button className="mt-5 inline-flex h-10 items-center justify-center rounded-[8px] bg-[#2d9cff] px-4 text-[13px] font-semibold text-white transition hover:bg-[#4aaaff]" type="button" onClick={reset}>Tentar novamente</button>
      </section>
    </main>
  );
}
