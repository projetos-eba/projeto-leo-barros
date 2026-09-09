"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { completePartnerClientProfile } from "@/app/parceiros/clientes/[id]/_actions/assessments";
import { loadPartnerClientProfile, savePartnerClientProfile } from "@/app/parceiros/clientes/[id]/_actions/profile";
import { clientBioSchema, type ClientBioDraft, type ClientProfileEditorData } from "@/lib/partners/client-profile-editor";

export function ClientProfileDrawer({ patientId, mode = "bio", open, onOpenChange, initialBio }: {
  patientId: string;
  mode?: "bio" | "full";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBio?: ClientBioDraft;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ClientProfileEditorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const initialRef = useRef(initialBio);
  initialRef.current = initialBio;
  useEffect(() => {
    if (!open) return;
    let active = true;
    setError(null);
    setDraft(null);
    if (mode === "bio" && initialRef.current) {
      setDraft({ ...initialRef.current, displayName: "", email: "", phone: "" });
    } else {
      void loadPartnerClientProfile(patientId).then((result) => {
        if (!active) return;
        setDraft(result.data ?? null);
        setError(result.error ?? null);
      }).catch(() => { if (active) setError("Não foi possível carregar o cadastro. Feche e tente novamente."); });
    }
    return () => { active = false; };
  }, [open, patientId, mode]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft || pending) return;
    if (!clientBioSchema.safeParse(draft).success) { setError("Revise a data de nascimento e o objetivo."); return; }
    setPending(true);
    setError(null);
    try {
      const result = mode === "full"
        ? await savePartnerClientProfile({ patientId, displayName: draft.displayName, phone: draft.phone, birthDate: draft.birthDate, biologicalSex: draft.biologicalSex, objective: draft.objective })
        : await completePartnerClientProfile({ patientId, birthDate: draft.birthDate, biologicalSex: draft.biologicalSex, objective: draft.objective });
      if (!result.ok) { setError(result.error ?? "Não foi possível salvar."); return; }
      onOpenChange(false);
      router.refresh();
    } catch { setError("Não foi possível salvar. Tente novamente."); }
    finally { setPending(false); }
  }
  const inputClass = "border-[#303746] bg-[#161a22] text-white";
  return <Sheet open={open} onOpenChange={(value) => { if (!pending) onOpenChange(value); }}>
    <SheetContent className="w-full overflow-y-auto border-[#303746] bg-[#0b1720] text-white sm:max-w-[520px]">
      <SheetHeader className="text-left">
        <SheetTitle className="text-white">{mode === "full" ? "Editar perfil" : "Editar bio"}</SheetTitle>
        <SheetDescription className="text-[#9aa5b6]">{mode === "full" ? "Atualize os dados cadastrais do Cliente." : "Atualize os dados usados nas avaliações."}</SheetDescription>
      </SheetHeader>
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      {!draft && !error && <p role="status" className="mt-6 text-sm text-[#9aa5b6]">Carregando cadastro...</p>}
      {draft && <form className="mt-6 grid gap-4" onSubmit={submit}>
        {mode === "full" && <>
          <label className="grid gap-2 text-sm">Nome<Input className={inputClass} required minLength={2} maxLength={160} value={draft.displayName} disabled={pending} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} /></label>
          <label className="grid gap-2 text-sm">E-mail<Input className={inputClass} readOnly value={draft.email} /></label>
          <label className="grid gap-2 text-sm">Telefone<Input className={inputClass} type="tel" placeholder="+5511999999999" value={draft.phone} disabled={pending} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /><span className="text-xs text-[#9aa5b6]">Inclua +, código do país e DDD.</span></label>
        </>}
        <label className="grid gap-2 text-sm">Data de nascimento<Input className={inputClass} required type="date" value={draft.birthDate} disabled={pending} onChange={(e) => setDraft({ ...draft, birthDate: e.target.value })} /></label>
        <div className="grid gap-2 text-sm"><label htmlFor="client-editor-sex">Sexo biológico</label><Select value={draft.biologicalSex} disabled={pending} onValueChange={(biologicalSex: ClientBioDraft["biologicalSex"]) => setDraft({ ...draft, biologicalSex })}>
          <SelectTrigger id="client-editor-sex" className={inputClass}><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="not_informed">Sexo não informado</SelectItem><SelectItem value="female">Feminino</SelectItem><SelectItem value="male">Masculino</SelectItem></SelectContent>
        </Select></div>
        <label className="grid gap-2 text-sm">Objetivo principal<Input className={inputClass} required maxLength={120} value={draft.objective} disabled={pending} onChange={(e) => setDraft({ ...draft, objective: e.target.value })} /></label>
        <div className="mt-4 flex justify-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={pending}>{pending ? "Salvando..." : mode === "bio" ? "Salvar bio" : "Salvar cadastro"}</Button></div>
      </form>}
    </SheetContent>
  </Sheet>;
}
