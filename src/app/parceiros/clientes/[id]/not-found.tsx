import Link from "next/link";

export default function ParceirosClienteNotFound() {
  return (
    <div className="min-h-screen bg-[#0b1720] px-5 py-10 font-['Rethink_Sans',sans-serif] text-[#f3f4f7] lg:px-6 lg:py-[74px]">
      <section className="mx-auto max-w-[620px] rounded-[14px] border border-[#303746] bg-[#181d25] p-8 text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#68afe9]">Cliente indisponível</p>
        <h1 className="mt-3 text-[28px] font-bold">Não encontramos este Cliente</h1>
        <p className="mt-3 text-[14px] leading-6 text-[#bac1ce]">
          O registro pode não existir ou não estar vinculado ao seu perfil de Parceiro.
        </p>
        <Link
          className="mt-6 inline-flex h-10 items-center rounded-[10px] bg-[#3b97e3] px-4 text-[14px] font-semibold text-white"
          href="/parceiros/clientes"
        >
          Voltar para Clientes
        </Link>
      </section>
    </div>
  );
}
