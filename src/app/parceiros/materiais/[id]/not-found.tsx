import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function PartnerMaterialNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#0b1720] px-6 text-center text-white">
      <FileQuestion className="size-12 text-[#587184]" />
      <h1 className="mt-5 text-xl font-semibold">Material não encontrado</h1>
      <p className="mt-2 text-sm text-[#8798a5]">Ele pode ter sido removido ou não pertence à sua biblioteca.</p>
      <Link className="mt-6 rounded-[8px] bg-[#168ce4] px-5 py-3 text-sm font-semibold" href="/parceiros/materiais">Voltar para Materiais</Link>
    </div>
  );
}
