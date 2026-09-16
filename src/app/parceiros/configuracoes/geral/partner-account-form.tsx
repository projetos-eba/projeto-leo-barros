"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { savePartnerAccount } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatPartnerPhone,
  professionalTypeLabels,
  registryTypeLabels,
  type PartnerAccountData,
  type PartnerAccountInput,
  partnerProfessionalTypes,
  partnerRegistryTypes,
} from "@/lib/auth/partner-account-contracts";

type PartnerAccountFormProps = {
  initialData: PartnerAccountData;
};

function buildDraft(data: PartnerAccountData): PartnerAccountInput {
  return {
    displayName: data.displayName,
    phone: formatPartnerPhone(data.phone),
    professionalType: data.professionalType,
    professionalRegistryType: data.professionalRegistryType,
    professionalRegistryNumber: data.professionalRegistryNumber,
  };
}

export function PartnerAccountForm({ initialData }: PartnerAccountFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PartnerAccountInput>(() => buildDraft(initialData));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openEditor() {
    setDraft(buildDraft(initialData));
    setFeedback(null);
    setOpen(true);
  }

  function closeEditor(nextOpen: boolean) {
    if (!nextOpen && !pending) setFeedback(null);
    setOpen(nextOpen);
  }

  function updateDraft<Key extends keyof PartnerAccountInput>(key: Key, value: PartnerAccountInput[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  }

  function submit() {
    setFeedback(null);
    startTransition(async () => {
      const result = await savePartnerAccount(draft);
      if (!result.ok) {
        setFeedback(result.error);
        return;
      }

      setOpen(false);
      setFeedback(result.message);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-col items-start gap-2">
        <Button className="rounded-[8px]" type="button" onClick={openEditor}>
          Editar dados básicos
        </Button>
        {feedback && !open ? <p className="text-[12px] text-[#72d696]" role="status">{feedback}</p> : null}
      </div>

      <Dialog open={open} onOpenChange={closeEditor}>
        <DialogContent className="border-[#294657] bg-[#101c27] text-[#f1f6fa] sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle className="text-[#f4f8fb]">Editar dados da conta</DialogTitle>
            <DialogDescription className="text-[#8ca1af]">
              Atualize seus dados profissionais. O e-mail continua disponível somente para consulta.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="partner-account-name">Nome</Label>
              <Input
                className="border-[#294657] bg-[#0b1720] text-[#f1f6fa]"
                disabled={pending}
                id="partner-account-name"
                value={draft.displayName}
                onChange={(event) => updateDraft("displayName", event.target.value)}
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="partner-account-email">E-mail</Label>
              <Input
                className="border-[#294657] bg-[#162630] text-[#9aabb8]"
                disabled
                id="partner-account-email"
                value={initialData.email}
              />
              <span className="text-[12px] text-[#7e92a1]">Para alterar o e-mail, entre em contato com o suporte.</span>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="partner-account-phone">Telefone com DDI</Label>
              <Input
                className="border-[#294657] bg-[#0b1720] text-[#f1f6fa]"
                disabled={pending}
                id="partner-account-phone"
                inputMode="tel"
                placeholder="+55 (11) 99999-9999"
                value={draft.phone}
                onChange={(event) => updateDraft("phone", formatPartnerPhone(event.target.value))}
              />
              <span className="text-[12px] text-[#7e92a1]">Use o código do país, como +55.</span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="partner-account-professional-type">Tipo profissional</Label>
              <Select
                disabled={pending}
                value={draft.professionalType}
                onValueChange={(value) => updateDraft("professionalType", value as PartnerAccountInput["professionalType"])}
              >
                <SelectTrigger className="border-[#294657] bg-[#0b1720]" id="partner-account-professional-type">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {partnerProfessionalTypes.map((type) => (
                    <SelectItem key={type} value={type}>{professionalTypeLabels[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="partner-account-registry-type">Tipo do registro</Label>
              <Select
                disabled={pending}
                value={draft.professionalRegistryType || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setDraft((current) => ({ ...current, professionalRegistryType: "", professionalRegistryNumber: "" }));
                    setFeedback(null);
                    return;
                  }
                  updateDraft("professionalRegistryType", value);
                }}
              >
                <SelectTrigger className="border-[#294657] bg-[#0b1720]" id="partner-account-registry-type">
                  <SelectValue placeholder="Sem registro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem registro</SelectItem>
                  {partnerRegistryTypes.map((type) => (
                    <SelectItem key={type} value={type}>{registryTypeLabels[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="partner-account-registry-number">Número do registro</Label>
              <Input
                className="border-[#294657] bg-[#0b1720] text-[#f1f6fa]"
                disabled={pending || !draft.professionalRegistryType}
                id="partner-account-registry-number"
                placeholder="Opcional"
                value={draft.professionalRegistryNumber}
                onChange={(event) => updateDraft("professionalRegistryNumber", event.target.value)}
              />
            </div>
          </div>

          {feedback ? <p className="rounded-[8px] border border-[#b16a06]/50 bg-[#2e2511] px-3 py-2 text-[13px] text-[#f1c36d]" role="alert">{feedback}</p> : null}

          <DialogFooter>
            <Button disabled={pending} type="button" variant="outline" onClick={() => closeEditor(false)}>Cancelar</Button>
            <Button disabled={pending} type="button" onClick={submit}>{pending ? "Salvando..." : "Salvar alterações"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
