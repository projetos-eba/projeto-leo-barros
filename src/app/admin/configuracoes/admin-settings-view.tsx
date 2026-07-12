"use client";

import {
  Activity,
  Check,
  Clock3,
  Database,
  History,
  KeyRound,
  Lock,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  TestTube2,
  UsersRound,
  WalletCards,
  Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import {
  addIntegrationAction,
  restoreSettingsSectionAction,
  saveGeneralSettingsAction,
  saveIntegrationAction,
  saveSecuritySettingsAction,
  testIntegrationAction,
} from "./actions";
import { InfoHint } from "@/components/ui/info-hint";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  AdminSettingsData,
  GeneralSettings,
  SecuritySettings,
  SettingsIntegration,
  SettingsSection,
} from "@/lib/admin/settings-metrics";
import { cn } from "@/lib/utils";

type AdminSettingsViewProps = {
  settings: AdminSettingsData;
};

type Tab = {
  icon: LucideIcon;
  id: SettingsSection;
  label: string;
};

const tabs: Tab[] = [
  { icon: Settings, id: "general", label: "Geral" },
  { icon: UsersRound, id: "users", label: "Usuários & Permissões" },
  { icon: Webhook, id: "integrations", label: "Integrações" },
  { icon: ShieldCheck, id: "security", label: "Segurança" },
];

const integrationIcons: Record<string, LucideIcon> = {
  storage: Database,
  stripe_billing: WalletCards,
  transactional_email: Mail,
  webhooks_api: Webhook,
  whatsapp_support: Activity,
};

const statusToneClasses: Record<SettingsIntegration["statusTone"], string> = {
  danger: "border-[#9d3b3b]/70 bg-[#401b20]/70 text-[#ff9b8f]",
  neutral: "border-[#456172]/70 bg-[#173140]/70 text-[#c2d0d8]",
  success: "border-[#1d8b46]/55 bg-[#1d8b46]/25 text-[#67d982]",
  warning: "border-[#b16a06]/55 bg-[#b16a06]/25 text-[#ebaa3a]",
};

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-[9px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 shadow-[0_18px_60px_rgba(2,10,16,0.24)]", className)}>
      {children}
    </section>
  );
}

function SectionHeader({ info, subtitle, title }: { info: string; subtitle?: string; title: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <h2 className="text-[17px] font-bold leading-[22px] text-[#dde7ee]">{title}</h2>
        <InfoHint label={info} />
      </div>
      {subtitle ? <p className="mt-2 text-[12px] leading-[18px] text-[#8ca1af]">{subtitle}</p> : null}
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-[12px] font-semibold text-[#aab7c2]">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "h-[40px] rounded-[6px] border border-[#1c3a4d] bg-[#071b2b] px-3 text-[13px] font-semibold text-[#e8edf2] outline-none transition placeholder:text-[#6f8593] focus:border-[#1e94ff]";
const textareaClass = "min-h-[96px] rounded-[6px] border border-[#1c3a4d] bg-[#071b2b] p-3 text-[13px] font-semibold leading-[19px] text-[#e8edf2] outline-none transition placeholder:text-[#6f8593] focus:border-[#1e94ff]";

function ToggleRow({ checked, description, label, onChange }: { checked: boolean; description: string; label: string; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[8px] border border-[#1c3a4d]/75 bg-[#0a2030] p-4">
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-[#e8edf2]">{label}</p>
        <p className="mt-1 text-[12px] leading-[17px] text-[#8ca1af]">{description}</p>
      </div>
      <button
        aria-pressed={checked}
        className={cn("relative h-6 w-11 shrink-0 rounded-full border transition", checked ? "border-[#1e94ff] bg-[#1e94ff]" : "border-[#365567] bg-[#071b2b]")}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span className={cn("absolute top-1 size-4 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
      </button>
    </div>
  );
}

function ActionBar({ activeTab, message, onRestore, onSave, pending }: { activeTab: SettingsSection; message: string; onRestore: () => void; onSave: () => void; pending: boolean }) {
  const disabled = activeTab === "users";

  return (
    <div className="mt-6 rounded-[9px] border border-[#2b4a5d]/90 bg-[#0b2538] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] border border-[#2b4a5d] bg-[#0a2030] px-4 text-[13px] font-bold text-[#aab7c2] transition hover:border-[#5ba8ff] hover:text-[#dce8ef] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={pending || disabled}
          onClick={onRestore}
          type="button"
        >
          <RotateCcw className="size-4" />
          Restaurar padrão
        </button>

        <p className="min-h-[18px] flex-1 text-[12px] font-semibold text-[#8ca1af] lg:text-center">{message}</p>

        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-[#1e94ff] px-6 text-[13px] font-bold text-white transition hover:bg-[#1688ef] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={pending || disabled}
          onClick={onSave}
          type="button"
        >
          <Save className="size-4" />
          Salvar alterações
        </button>
      </div>
    </div>
  );
}

function GeneralTab({ general, onChange }: { general: GeneralSettings; onChange: (general: GeneralSettings) => void }) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel className="p-[22px]">
        <SectionHeader
          info="Controla dados públicos da plataforma e o aviso usado quando o modo de manutenção estiver ativo."
          subtitle="Informações básicas, domínio principal e disponibilidade."
          title="Configurações gerais da plataforma"
        />
        <div className="mt-6 grid gap-5">
          <Field label="Nome da plataforma">
            <input className={inputClass} value={general.platformName} onChange={(event) => onChange({ ...general, platformName: event.target.value })} />
          </Field>
          <Field label="Domínio principal">
            <input className={inputClass} value={general.platformDomain} onChange={(event) => onChange({ ...general, platformDomain: event.target.value })} />
          </Field>
          <ToggleRow
            checked={general.maintenanceMode}
            description="Quando ativo, informa indisponibilidade planejada para o público."
            label="Modo de manutenção"
            onChange={(checked) => onChange({ ...general, maintenanceMode: checked })}
          />
          <Field label="Mensagem de manutenção">
            <textarea className={textareaClass} maxLength={200} value={general.maintenanceMessage} onChange={(event) => onChange({ ...general, maintenanceMessage: event.target.value })} />
          </Field>
        </div>
      </Panel>

      <Panel className="p-[22px]">
        <SectionHeader
          info="Prévia do identificador da marca usado no shell administrativo."
          subtitle="Logo atual da plataforma."
          title="Branding"
        />
        <div className="mt-6 grid gap-4">
          <div className="flex size-24 items-center justify-center rounded-[9px] bg-white text-[32px] font-bold text-[#061725]">LB</div>
          <div className="rounded-[8px] border border-dashed border-[#31536a] bg-[#071b2b] p-5 text-[13px] leading-[19px] text-[#8ca1af]">
            Upload de logo fica preparado visualmente, mas a persistência de arquivo entra junto com a estratégia final de storage.
          </div>
        </div>
      </Panel>
    </div>
  );
}

function UsersTab({ admins }: { admins: AdminSettingsData["admins"] }) {
  return (
    <Panel className="p-[22px]">
      <SectionHeader
        info="Lista admins cadastrados e mantem a visao de acesso administrativo."
        subtitle="Visão operacional de usuários com acesso administrativo."
        title="Usuários & Permissões"
      />
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-[#294657]/80 text-[11px] font-semibold text-[#8495a3]">
              <th className="px-2 py-3">Usuário</th>
              <th className="px-2 py-3">E-mail</th>
              <th className="px-2 py-3">Perfil</th>
              <th className="px-2 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#294657]/55">
            {admins.length === 0 ? (
              <tr><td className="px-2 py-6 text-center text-[13px] text-[#8ca1af]" colSpan={4}>Nenhum admin listado no banco local.</td></tr>
            ) : admins.map((admin) => (
              <tr className="text-[12px] text-[#b8c5ce]" key={admin.id}>
                <td className="px-2 py-3 font-bold text-[#d5dee5]">{admin.name}</td>
                <td className="px-2 py-3">{admin.email}</td>
                <td className="px-2 py-3">Super/Admin</td>
                <td className="px-2 py-3"><span className="rounded-[4px] border border-[#1d8b46]/55 bg-[#1d8b46]/25 px-2 py-1 text-[10px] font-bold text-[#67d982]">{admin.statusLabel}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function IntegrationCard({ integration, onConfigure, onTest, pending }: { integration: SettingsIntegration; onConfigure: (integration: SettingsIntegration) => void; onTest: (integration: SettingsIntegration) => void; pending: boolean }) {
  const Icon = integrationIcons[integration.key] ?? Webhook;

  return (
    <article className="rounded-[8px] border border-[#294657]/80 bg-[#0b2230] p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#123a55] text-[#5ba8ff]">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#e8edf2]">{integration.name}</h3>
            <span className={cn("rounded-[4px] border px-2 py-1 text-[10px] font-bold", statusToneClasses[integration.statusTone])}>{integration.statusLabel}</span>
          </div>
          <p className="mt-1 text-[12px] font-semibold text-[#8ca1af]">{integration.category}</p>
          <p className="mt-3 text-[12px] leading-[18px] text-[#aab7c2]">{integration.lastTestMessage}</p>
          <p className="mt-2 text-[11px] text-[#738997]">Último teste: {integration.lastTestLabel}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="inline-flex h-9 items-center gap-2 rounded-[5px] border border-[#31536a] px-3 text-[12px] font-bold text-[#7dbaff] hover:border-[#5ba8ff]" onClick={() => onConfigure(integration)} type="button">
          <KeyRound className="size-4" />
          Configurar
        </button>
        <button className="inline-flex h-9 items-center gap-2 rounded-[5px] bg-[#0e4a7b] px-3 text-[12px] font-bold text-[#d9ecfb] disabled:opacity-50" disabled={pending} onClick={() => onTest(integration)} type="button">
          <TestTube2 className="size-4" />
          Testar
        </button>
      </div>
    </article>
  );
}

function IntegrationsTab({ integrations, onAdd, onConfigure, onTest, pending }: { integrations: SettingsIntegration[]; onAdd: () => void; onConfigure: (integration: SettingsIntegration) => void; onTest: (integration: SettingsIntegration) => void; pending: boolean }) {
  return (
    <Panel className="p-[22px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          info="Mostra integrações preparadas para operação e seus dados de configuração."
          subtitle="Configure referências não sensíveis e acompanhe a prontidão operacional."
          title="Integrações"
        />
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-[#1e94ff] px-4 text-[12px] font-bold text-white" onClick={onAdd} type="button">
          <Plus className="size-4" />
          Adicionar integração
        </button>
      </div>
      <div className="mt-6 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <IntegrationCard integration={integration} key={integration.key} onConfigure={onConfigure} onTest={onTest} pending={pending} />
        ))}
      </div>
      <button className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-[6px] border border-[#31536a] bg-[#0a2030] px-4 text-[12px] font-bold text-[#7dbaff] disabled:opacity-50" disabled={pending} onClick={() => integrations.forEach(onTest)} type="button">
        <TestTube2 className="size-4" />
        Testar integrações
      </button>
    </Panel>
  );
}

function SecurityTab({ onChange, security }: { onChange: (security: SecuritySettings) => void; security: SecuritySettings }) {
  return (
    <Panel className="p-[22px]">
      <SectionHeader
        info="Controla políticas administrativas da plataforma."
        subtitle="Proteja plataforma e controle acessos administrativos."
        title="Segurança e acesso"
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ToggleRow checked={security.require2fa} description="Mantém a política de 2FA como requisito operacional para admins." label="Autenticação de dois fatores (2FA)" onChange={(checked) => onChange({ ...security, require2fa: checked })} />
        <ToggleRow checked={security.restrictByIp} description="Reserva o controle para uma futura lista de IPs permitidos." label="Acesso por IP restrito" onChange={(checked) => onChange({ ...security, restrictByIp: checked })} />
        <ToggleRow checked={security.auditTrailEnabled} description="Registra ações administrativas em Últimas alterações." label="Trilha de auditoria" onChange={(checked) => onChange({ ...security, auditTrailEnabled: checked })} />
        <Field label="Tempo de sessão (minutos)">
          <input className={inputClass} max={720} min={15} type="number" value={security.sessionTimeoutMinutes} onChange={(event) => onChange({ ...security, sessionTimeoutMinutes: Number(event.target.value) })} />
        </Field>
      </div>
    </Panel>
  );
}

function ActivityTimeline({ activities }: { activities: AdminSettingsData["activities"] }) {
  return (
    <Panel className="mt-8 p-[22px]">
      <SectionHeader
        info="Histórico das alterações administrativas feitas nesta página."
        subtitle="Registro mais recente de configurações, segurança e integrações."
        title="Últimas alterações"
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {activities.length === 0 ? (
          <p className="rounded-[8px] border border-dashed border-[#31536a] py-8 text-center text-[13px] text-[#8ca1af] md:col-span-2">Sem alterações registradas.</p>
        ) : activities.map((activity) => (
          <article className="flex gap-4 rounded-[8px] border border-[#294657]/70 bg-[#0b2230] p-4" key={activity.id}>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#123a55] text-[#5ba8ff]">
              <History className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[13px] font-bold text-[#e8edf2]">{activity.title}</h3>
                <span className="text-[11px] font-semibold text-[#8ca1af]">{activity.createdAt}</span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[#738997]">{activity.actor}</p>
              <p className="mt-3 text-[12px] leading-[18px] text-[#aab7c2]">{activity.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function IntegrationDrawer({ integration, onOpenChange, onSave, onTest, open, pending }: { integration: SettingsIntegration | null; onOpenChange: (open: boolean) => void; onSave: (integration: SettingsIntegration, config: Record<string, string>) => void; onTest: (integration: SettingsIntegration, config?: Record<string, string>) => void; open: boolean; pending: boolean }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const activeDraft = integration ? { ...integration.config, ...draft } : {};

  return (
    <Sheet open={open} onOpenChange={(next) => {
      if (!next) setDraft({});
      onOpenChange(next);
    }}>
      <SheetContent className="w-full overflow-y-auto border-l border-[#244454] bg-[#082235] p-0 text-[#e8edf2] sm:max-w-[430px]" side="right">
        <SheetHeader className="border-b border-[#19394c] px-6 py-5 text-left">
          <SheetTitle className="text-[21px] font-bold text-[#e8edf2]">Configurar integração</SheetTitle>
          <SheetDescription className="mt-1 text-[13px] text-[#8ca1af]">
            Salve apenas dados públicos ou referências a segredos externos.
          </SheetDescription>
        </SheetHeader>
        {integration ? (
          <div className="grid gap-5 px-6 py-5">
            <div>
              <p className="text-[18px] font-bold text-[#e8edf2]">{integration.name}</p>
              <p className="mt-1 text-[12px] font-semibold text-[#8ca1af]">{integration.category}</p>
            </div>
            {Object.entries(activeDraft).map(([key, value]) => (
              <Field key={key} label={key}>
                <input className={inputClass} value={value} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} />
              </Field>
            ))}
            {Object.keys(activeDraft).length === 0 ? (
              <p className="rounded-[8px] border border-dashed border-[#31536a] p-4 text-[13px] leading-[19px] text-[#8ca1af]">
                Integração customizada criada. Adicionaremos campos estruturados quando a integração for definida.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 border-t border-[#19394c] pt-5">
              <button className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[6px] border border-[#31536a] px-4 text-[12px] font-bold text-[#7dbaff] disabled:opacity-50" disabled={pending} onClick={() => onTest(integration, activeDraft)} type="button">
                <TestTube2 className="size-4" />
                Testar
              </button>
              <button className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[6px] bg-[#1e94ff] px-4 text-[12px] font-bold text-white disabled:opacity-50" disabled={pending} onClick={() => onSave(integration, activeDraft)} type="button">
                <Check className="size-4" />
                Salvar
              </button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function AdminSettingsView({ settings }: AdminSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsSection>("general");
  const [general, setGeneral] = useState(settings.general);
  const [security, setSecurity] = useState(settings.security);
  const [integrations, setIntegrations] = useState(settings.integrations);
  const [selectedIntegration, setSelectedIntegration] = useState<SettingsIntegration | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeTitle = useMemo(() => tabs.find((tab) => tab.id === activeTab)?.label ?? "Geral", [activeTab]);

  function updateIntegration(key: string, patch: Partial<SettingsIntegration>) {
    setIntegrations((items) => items.map((item) => item.key === key ? { ...item, ...patch } : item));
  }

  function handleSave() {
    startTransition(async () => {
      const result = activeTab === "security"
        ? await saveSecuritySettingsAction(security)
        : await saveGeneralSettingsAction(general);
      setMessage(result.message);
    });
  }

  function handleRestore() {
    startTransition(async () => {
      const section = activeTab === "security" ? "security" : "general";
      const result = await restoreSettingsSectionAction(section);
      setMessage(result.message);
    });
  }

  function handleConfigure(integration: SettingsIntegration) {
    setSelectedIntegration(integration);
    setDrawerOpen(true);
  }

  function handleSaveIntegration(integration: SettingsIntegration, config: Record<string, string>) {
    startTransition(async () => {
      const result = await saveIntegrationAction({ config, integrationKey: integration.key, name: integration.name });
      if (result.ok) {
        updateIntegration(integration.key, {
          config,
          lastTestMessage: "Configuração salva. Execute um teste para validar.",
          status: Object.values(config).some((value) => value.trim()) ? "inactive" : "needs_config",
          statusLabel: Object.values(config).some((value) => value.trim()) ? "Inativo" : "Configurar",
          statusTone: Object.values(config).some((value) => value.trim()) ? "neutral" : "warning",
        });
        setDrawerOpen(false);
      }
      setMessage(result.message);
    });
  }

  function handleTestIntegration(integration: SettingsIntegration, config = integration.config) {
    startTransition(async () => {
      const result = await testIntegrationAction({ config, integrationKey: integration.key, name: integration.name });
      updateIntegration(integration.key, {
        config,
        lastTestLabel: "Agora",
        lastTestMessage: result.message,
        status: result.ok ? "active" : "needs_config",
        statusLabel: result.ok ? "Conectado" : "Configurar",
        statusTone: result.ok ? "success" : "warning",
      });
      setMessage(result.message);
    });
  }

  function handleAddIntegration() {
    startTransition(async () => {
      const name = `Integração customizada ${integrations.filter((item) => item.key.startsWith("custom_")).length + 1}`;
      const result = await addIntegrationAction({ category: "Customizada", name });
      if (result.ok) {
        const key = `custom_integracao_customizada_${integrations.filter((item) => item.key.startsWith("custom_")).length + 1}`;
        setIntegrations((items) => [
          ...items,
          {
            category: "Customizada",
            config: {},
            configuredFields: [],
            id: key,
            key,
            lastTestLabel: "Ainda não testado",
            lastTestMessage: "Aguardando configuração.",
            name,
            status: "needs_config",
            statusLabel: "Configurar",
            statusTone: "warning",
          },
        ]);
      }
      setMessage(result.message);
    });
  }

  return (
    <div className="min-h-screen bg-[#0b1720] px-5 py-6 font-['Rethink_Sans',sans-serif] text-[#f1f6fa] md:px-8 lg:px-[43px] lg:py-[35px]">
      <header className="flex flex-col gap-4 border-b border-[#244454]/70 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5db7ef]">Admin</p>
          <h1 className="mt-2 text-[30px] font-bold leading-[36px] text-[#f4f8fb] md:text-[34px]">Configurações</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-[22px] text-[#8ca1af]">
            Ajuste regras, acessos e integrações da plataforma com persistência no banco local.
          </p>
        </div>
        <div className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#2b4a5d] bg-[#0d2635]/80 px-3 text-[13px] font-semibold text-[#629bdb]">
          <Clock3 className="size-4" />
          Atualizado agora
        </div>
      </header>

      <nav aria-label="Seções de configurações" className="mt-7 overflow-x-auto border-b border-[#244454]/70">
        <div className="flex min-w-max gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <button
                aria-current={active ? "page" : undefined}
                className={cn("inline-flex h-12 items-center gap-2 border-b-2 px-1 text-[13px] font-bold transition", active ? "border-[#1e94ff] text-[#5ba8ff]" : "border-transparent text-[#8ca1af] hover:text-[#dce8ef]")}
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage("");
                }}
                type="button"
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mt-6">
        <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#5db7ef]">{activeTitle}</p>
        {activeTab === "general" ? <GeneralTab general={general} onChange={setGeneral} /> : null}
        {activeTab === "users" ? <UsersTab admins={settings.admins} /> : null}
        {activeTab === "integrations" ? <IntegrationsTab integrations={integrations} onAdd={handleAddIntegration} onConfigure={handleConfigure} onTest={handleTestIntegration} pending={isPending} /> : null}
        {activeTab === "security" ? <SecurityTab security={security} onChange={setSecurity} /> : null}

        {activeTab !== "integrations" ? (
          <ActionBar activeTab={activeTab} message={message} onRestore={handleRestore} onSave={handleSave} pending={isPending} />
        ) : (
          <p className="mt-4 min-h-[18px] text-[12px] font-semibold text-[#8ca1af]">{message}</p>
        )}

        <ActivityTimeline activities={settings.activities} />
      </main>

      <IntegrationDrawer
        integration={selectedIntegration}
        onOpenChange={setDrawerOpen}
        onSave={handleSaveIntegration}
        onTest={handleTestIntegration}
        open={drawerOpen}
        pending={isPending}
      />
    </div>
  );
}
