"use client";

import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock3,
  Download,
  ExternalLink,
  Headphones,
  MessageSquarePlus,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { InfoHint } from "@/components/ui/info-hint";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DEFAULT_PLATFORM_NAME } from "@/lib/branding/platform-branding-contract";
import { cn } from "@/lib/utils";
import type { AdminSupportData, SupportKpi, SupportTicketRow } from "@/lib/admin/support-metrics";

type AdminSupportViewProps = {
  platformName?: string;
  support: AdminSupportData;
};

type FilterValue = "all" | string;

const kpiIcons: Record<SupportKpi["id"], typeof Headphones> = {
  avgResponse: Clock3,
  openTickets: Headphones,
  sla: Check,
};

const toneClasses = {
  danger: "border-[#ef4444] bg-[#0a2030] text-[#ef4444]",
  info: "border-[#1e94ff] bg-[#0a2030] text-[#5ba8ff]",
  success: "border-[#28c76f] bg-[#0a2030] text-[#28c76f]",
  warning: "border-[#f59e0b] bg-[#0a2030] text-[#f59e0b]",
};

const trendClasses = {
  bad: "text-[#ef6a5b]",
  good: "text-[#2ddb72]",
  neutral: "text-[#aab7c2]",
};

function KpiCard({ metric }: { metric: SupportKpi }) {
  const Icon = kpiIcons[metric.id];

  return (
    <article className="rounded-[8px] border border-[#244454] bg-[#082235] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex size-[58px] shrink-0 items-center justify-center rounded-full",
            metric.id === "openTickets" && "bg-[#f0a52b]/20 text-[#f0a52b]",
            metric.id === "sla" && "bg-[#28c76f]/20 text-[#28c76f]",
            metric.id === "avgResponse" && "bg-[#1e94ff]/20 text-[#1e94ff]",
          )}
        >
          <Icon className="size-7" />
        </div>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold leading-[20px] text-[#aab7c2]">{metric.label}</p>
          <p className="mt-1 text-[12px] leading-[16px] text-[#738997]">{metric.description}</p>
        </div>
      </div>
      <p className="mt-7 text-[42px] font-semibold leading-none text-[#e8edf2]">{metric.value}</p>
      <p className={cn("mt-4 text-[17px] font-bold leading-[22px]", trendClasses[metric.trend])}>{metric.delta}</p>
      <p className="mt-2 text-[14px] font-semibold leading-[20px] text-[#aab7c2]">vs. mês anterior</p>
    </article>
  );
}

function FilterSelect({ label, options, value, onChange }: { label: string; options: string[]; value: FilterValue; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-[12px] font-semibold text-[#aab7c2]">{label}</span>
      <select
        className="h-[38px] rounded-[5px] border border-[#19394c] bg-[#071b2b] px-3 text-[13px] font-semibold text-[#e8edf2] outline-none transition focus:border-[#1e94ff]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="all">{label === "Categoria" ? "Todas" : "Todos"}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TicketBadge({ children, tone }: { children: string; tone: keyof typeof toneClasses }) {
  return (
    <span className={cn("inline-flex min-h-[26px] items-center justify-center rounded-[5px] border px-2 text-center text-[11px] font-bold leading-[13px]", toneClasses[tone])}>
      {children}
    </span>
  );
}

function TicketDrawer({ onOpenChange, open, ticket }: { onOpenChange: (open: boolean) => void; open: boolean; ticket: SupportTicketRow | null }) {
  const [mode, setMode] = useState<"reply" | "internal">("reply");
  const [message, setMessage] = useState("");
  const [sentMessages, setSentMessages] = useState<{ body: string; mode: "reply" | "internal" }[]>([]);

  if (!ticket) return null;

  function sendMessage() {
    const trimmed = message.trim();
    if (!trimmed) return;
    setSentMessages((items) => [...items, { body: trimmed, mode }]);
    setMessage("");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-l border-[#244454] bg-[#082235] p-0 text-[#e8edf2] sm:max-w-[430px]" side="right">
        <SheetHeader className="border-b border-[#19394c] px-6 py-5 text-left">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <SheetTitle className="text-[21px] font-bold text-[#e8edf2]">Ticket selecionado</SheetTitle>
              <SheetDescription className="mt-1 text-[13px] text-[#8ca1af]">
                Detalhes, histórico e resposta operacional.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="grid gap-6 px-6 py-5">
          <section>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[18px] font-bold text-[#e8edf2]">{ticket.ticketNumber}</h3>
              <TicketBadge tone={ticket.priorityTone}>{ticket.priorityLabel}</TicketBadge>
              <TicketBadge tone={ticket.statusTone}>{ticket.statusLabel}</TicketBadge>
              <span className="text-[11px] font-semibold text-[#aab7c2]">Aberto há {ticket.openedSinceLabel}</span>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-[#d7a06f] text-[18px] font-bold text-[#061725]">
                {ticket.initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[17px] font-bold text-[#e8edf2]">{ticket.professionalName}</p>
                <p className="truncate text-[12px] font-medium text-[#aab7c2]">{ticket.email}</p>
              </div>
              <button className="ml-auto rounded-[6px] p-2 text-[#aab7c2] hover:bg-[#0d2b3d] hover:text-[#5ba8ff]" type="button" aria-label="Abrir perfil do profissional">
                <ExternalLink className="size-4" />
              </button>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 border-y border-[#19394c] py-4 text-[12px] sm:grid-cols-4">
            <div>
              <p className="font-semibold text-[#8497a6]">Categoria</p>
              <p className="mt-2 font-bold text-[#e8edf2]">{ticket.category}</p>
            </div>
            <div>
              <p className="font-semibold text-[#8497a6]">Prioridade</p>
              <p className={cn("mt-2 font-bold", ticket.priorityTone === "danger" ? "text-[#ef4444]" : "text-[#e8edf2]")}>{ticket.priorityLabel}</p>
            </div>
            <div>
              <p className="font-semibold text-[#8497a6]">SLA</p>
              <p className={cn("mt-2 font-bold", ticket.slaTone === "danger" ? "text-[#ef4444]" : "text-[#28c76f]")}>{ticket.slaLabel}</p>
            </div>
            <div>
              <p className="font-semibold text-[#8497a6]">Responsável</p>
              <p className="mt-2 font-bold text-[#e8edf2]">{ticket.responsible}</p>
            </div>
          </section>

          <section className="grid gap-4 border-b border-[#19394c] pb-5">
            <div>
              <p className="text-[11px] font-semibold text-[#8497a6]">Assunto</p>
              <p className="mt-2 text-[14px] font-semibold text-[#e8edf2]">{ticket.subject}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#8497a6]">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ticket.tags.map((tag) => <TicketBadge key={tag} tone="info">{tag}</TicketBadge>)}
              </div>
            </div>
          </section>

          <section className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#d7a06f] text-[12px] font-bold text-[#061725]">{ticket.initial}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-bold text-[#e8edf2]">{ticket.professionalName}</p>
                  <span className="text-[10px] font-medium text-[#aab7c2]">{ticket.lastInteractionLabel}</span>
                </div>
                <div className="mt-2 rounded-[7px] border border-[#22485f] bg-[#122d3d] p-4 text-[12px] leading-[18px] text-[#c5d2da]">
                  Preciso de ajuda com: {ticket.subject}. O atendimento foi aberto em {ticket.createdAtLabel}.
                </div>
              </div>
            </div>

            <div className="ml-2 rounded-[7px] bg-[#0e4a7b] p-4 text-[12px] leading-[18px] text-[#e8edf2]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <strong>Equipe suporte</strong>
                <span className="text-[10px] text-[#b8d8f4]">Sistema</span>
              </div>
              Ticket classificado como {ticket.priorityLabel.toLowerCase()} e encaminhado para {ticket.responsible}.
            </div>

            {sentMessages.map((item, index) => (
              <div className={cn("rounded-[7px] p-4 text-[12px] leading-[18px]", item.mode === "reply" ? "bg-[#0e4a7b] text-[#e8edf2]" : "border border-[#f59e0b] bg-[#2b220e] text-[#f6d99a]")} key={`${item.body}-${index}`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <strong>{item.mode === "reply" ? "Você" : "Nota interna"}</strong>
                  <span className="text-[10px] opacity-80">Agora</span>
                </div>
                {item.body}
              </div>
            ))}

            <div className="rounded-[7px] border border-[#19394c] bg-[#071b2b] p-3">
              <div className="flex gap-4 border-b border-[#19394c] pb-3 text-[12px] font-bold">
                <button className={cn(mode === "reply" ? "text-[#5ba8ff]" : "text-[#aab7c2]")} type="button" onClick={() => setMode("reply")}>Responder</button>
                <button className={cn(mode === "internal" ? "text-[#5ba8ff]" : "text-[#aab7c2]")} type="button" onClick={() => setMode("internal")}>Nota interna</button>
              </div>
              <textarea
                className="mt-3 h-28 w-full resize-none rounded-[6px] border border-[#19394c] bg-[#071b2b] p-3 text-[13px] text-[#e8edf2] outline-none placeholder:text-[#8497a6] focus:border-[#1e94ff]"
                placeholder={mode === "reply" ? "Digite sua resposta..." : "Digite uma nota interna..."}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <div className="mt-3 flex items-center gap-2">
                <button className="rounded-[5px] p-2 text-[#aab7c2] hover:bg-[#0d2b3d]" type="button" aria-label="Adicionar emoji"><Smile className="size-4" /></button>
                <button className="rounded-[5px] p-2 text-[#aab7c2] hover:bg-[#0d2b3d]" type="button" aria-label="Anexar arquivo"><Paperclip className="size-4" /></button>
                <button
                  className="ml-auto inline-flex h-9 items-center gap-2 rounded-[5px] bg-[#1e94ff] px-4 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!message.trim()}
                  type="button"
                  onClick={sendMessage}
                >
                  <Send className="size-4" />
                  Enviar resposta
                </button>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AdminSupportView({ platformName = DEFAULT_PLATFORM_NAME, support }: AdminSupportViewProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FilterValue>("all");
  const [priority, setPriority] = useState<FilterValue>("all");
  const [category, setCategory] = useState<FilterValue>("all");
  const [responsible, setResponsible] = useState<FilterValue>("all");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(support.tickets[0]?.id ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const options = useMemo(() => ({
    categories: Array.from(new Set(support.tickets.map((ticket) => ticket.category))).sort(),
    priorities: Array.from(new Set(support.tickets.map((ticket) => ticket.priorityLabel))).sort(),
    responsibles: Array.from(new Set(support.tickets.map((ticket) => ticket.responsible))).sort(),
    statuses: Array.from(new Set(support.tickets.map((ticket) => ticket.statusLabel))).sort(),
  }), [support.tickets]);

  const filteredTickets = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return support.tickets.filter((ticket) => {
      const matchesSearch = !normalized
        || ticket.ticketNumber.toLowerCase().includes(normalized)
        || ticket.professionalName.toLowerCase().includes(normalized)
        || ticket.subject.toLowerCase().includes(normalized);

      return matchesSearch
        && (status === "all" || ticket.statusLabel === status)
        && (priority === "all" || ticket.priorityLabel === priority)
        && (category === "all" || ticket.category === category)
        && (responsible === "all" || ticket.responsible === responsible);
    });
  }, [category, priority, responsible, search, status, support.tickets]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleTickets = filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedTicket = support.tickets.find((ticket) => ticket.id === selectedTicketId) ?? support.tickets[0] ?? null;

  function openTicket(ticket: SupportTicketRow) {
    setSelectedTicketId(ticket.id);
    setDrawerOpen(true);
  }

  function resetToFirstPage(next: () => void) {
    next();
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-[#0b1720] px-5 py-6 font-['Rethink_Sans',sans-serif] text-[#f1f6fa] md:px-8 lg:px-[43px] lg:py-[35px]">
      <header className="flex flex-col gap-4 border-b border-[#244454]/70 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5db7ef]">Admin</p>
          <h1 className="mt-2 text-[34px] font-bold leading-[40px] text-[#f4f8fb]">Suporte</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-[22px] text-[#8ca1af]">
            Acompanhe tickets e comunique-se com profissionais que precisam de ajuda.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#2b4a5d] bg-[#0d2635]/80 px-3 text-[13px] font-semibold text-[#629bdb]">
            <CalendarDays className="size-4" />
            {support.periodLabel}
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#1e94ff] bg-[#071b2b] px-4 text-[13px] font-bold text-[#1e94ff]"
            type="button"
            onClick={() => setActionMessage("Novo ticket interno ficará disponível quando a criação de tickets for liberada para Admin.")}
          >
            <Plus className="size-4" />
            Novo ticket interno
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[#1e94ff] px-4 text-[13px] font-bold text-white"
            type="button"
            onClick={() => setActionMessage(`${filteredTickets.length} ticket(s) no recorte atual prontos para resposta em massa.`)}
          >
            <MessageSquarePlus className="size-4" />
            Responder em massa
          </button>
        </div>
      </header>

      <section className="mt-7 grid gap-4 lg:grid-cols-3">
        {support.kpis.map((metric) => <KpiCard key={metric.id} metric={metric} />)}
      </section>

      {support.delayedCount > 0 ? (
        <button
          className="mt-6 flex w-full items-center gap-5 rounded-[8px] border border-[#b45309] bg-[rgba(21,29,33,0.85)] px-5 py-4 text-left"
          type="button"
          onClick={() => resetToFirstPage(() => setStatus("Novo"))}
        >
          <AlertTriangle className="size-7 shrink-0 text-[#f97316]" />
          <span className="min-w-0">
            <span className="block text-[18px] font-bold text-[#f97316]">Alertas de atraso</span>
            <span className="mt-1 block text-[14px] font-medium text-[#aab7c2]">{support.delayedCount} ticket(s) com SLA vencido aguardando acompanhamento.</span>
          </span>
          <span className="ml-auto text-[14px] font-bold text-[#5ba8ff]">Ver tickets</span>
        </button>
      ) : null}

      {actionMessage ? (
        <div className="mt-5 flex items-center gap-3 rounded-[8px] border border-[#226a9e] bg-[#092538] px-4 py-3 text-[13px] text-[#bfe3ff]" role="status">
          <span className="min-w-0 flex-1">{actionMessage}</span>
          <button className="rounded p-1 text-[#bfe3ff]" type="button" onClick={() => setActionMessage(null)} aria-label="Fechar aviso">
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <section className="mt-6 rounded-[8px] border border-[#19394c] bg-[#082235] p-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_115px_130px_130px_140px]">
          <label className="flex h-[53px] items-center gap-3 rounded-[6px] border border-[#19394c] bg-[#071b2b] px-4">
            <input
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[#e8edf2] outline-none placeholder:text-[#aab7c2]"
              placeholder="Buscar por ID, profissional ou assunto..."
              type="search"
              value={search}
              onChange={(event) => resetToFirstPage(() => setSearch(event.target.value))}
            />
            <Search className="size-5 text-[#aab7c2]" />
          </label>
          <FilterSelect label="Status" options={options.statuses} value={status} onChange={(value) => resetToFirstPage(() => setStatus(value))} />
          <FilterSelect label="Prioridade" options={options.priorities} value={priority} onChange={(value) => resetToFirstPage(() => setPriority(value))} />
          <FilterSelect label="Categoria" options={options.categories} value={category} onChange={(value) => resetToFirstPage(() => setCategory(value))} />
          <FilterSelect label="Responsável" options={options.responsibles} value={responsible} onChange={(value) => resetToFirstPage(() => setResponsible(value))} />
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-[9px] border border-[#19394c] bg-[#082235]">
        <div className="flex items-center gap-2 border-b border-[#19394c] px-5 py-4">
          <h2 className="text-[18px] font-bold text-[#e8edf2]">Tickets</h2>
          <InfoHint label="Lista tickets reais de support_tickets. Categoria e responsável são derivados enquanto o schema dedicado de atendimento não existe." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead className="text-[12px] font-bold text-[#aab7c2]">
              <tr className="border-b border-[#19394c]">
                <th className="px-4 py-4">ID</th>
                <th className="px-4 py-4">Profissional</th>
                <th className="px-4 py-4">Assunto</th>
                <th className="px-4 py-4">Prioridade</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Última interação</th>
                <th className="px-4 py-4">SLA</th>
                <th className="px-4 py-4">Responsável</th>
                <th className="px-4 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visibleTickets.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-[14px] text-[#8ca1af]" colSpan={9}>
                    Nenhum ticket encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : visibleTickets.map((ticket) => (
                <tr
                  className={cn(
                    "border-b border-[#19394c] text-[12px] text-[#aab7c2] transition hover:bg-[#0d2b3d]",
                    ticket.id === selectedTicketId && "bg-[#0d2b3d]/70",
                  )}
                  key={ticket.id}
                >
                  <td className="px-4 py-4 font-bold">{ticket.ticketNumber}</td>
                  <td className="px-4 py-4">
                    <button className="flex items-center gap-3 text-left" type="button" onClick={() => openTicket(ticket)}>
                      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#c68255] text-[12px] font-bold text-[#061725]">{ticket.initial}</span>
                      <span className="font-semibold">{ticket.professionalName}</span>
                    </button>
                  </td>
                  <td className="max-w-[220px] px-4 py-4 font-semibold">{ticket.subject}</td>
                  <td className="px-4 py-4"><TicketBadge tone={ticket.priorityTone}>{ticket.priorityLabel}</TicketBadge></td>
                  <td className="px-4 py-4"><TicketBadge tone={ticket.statusTone}>{ticket.statusLabel}</TicketBadge></td>
                  <td className="px-4 py-4">{ticket.lastInteractionLabel}</td>
                  <td className="px-4 py-4"><TicketBadge tone={ticket.slaTone}>{ticket.slaLabel}</TicketBadge></td>
                  <td className="px-4 py-4 font-semibold">{ticket.responsible}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      className="inline-flex size-8 items-center justify-center rounded-[5px] text-[#aab7c2] hover:bg-[#123247] hover:text-[#5ba8ff]"
                      type="button"
                      onClick={() => openTicket(ticket)}
                      aria-label={`Abrir ticket ${ticket.ticketNumber}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#19394c] px-5 py-4 text-[12px] font-semibold text-[#aab7c2] md:flex-row md:items-center md:justify-between">
          <span>Exibindo {visibleTickets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, filteredTickets.length)} de {filteredTickets.length} tickets</span>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((pageNumber) => (
              <button
                className={cn(
                  "flex size-8 items-center justify-center rounded-[5px] border border-[#19394c]",
                  pageNumber === currentPage ? "border-[#1e94ff] bg-[#0b3354] text-[#1e94ff]" : "bg-[#071b2b] text-[#aab7c2]",
                )}
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <select
              aria-label="Tickets por página"
              className="h-9 rounded-[5px] border border-[#19394c] bg-[#071b2b] px-3 text-[#aab7c2] outline-none"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
            </select>
          </div>
        </div>
      </section>

      <footer className="mt-7 flex flex-col gap-2 border-t border-[#244454]/70 pt-5 text-[12px] text-[#718795] md:flex-row md:items-center md:justify-between">
        <span>{platformName} — Suporte Admin</span>
        <span>Atualizado pelo banco local em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(support.generatedAt))}</span>
      </footer>

      <TicketDrawer open={drawerOpen} onOpenChange={setDrawerOpen} ticket={selectedTicket} />
    </div>
  );
}
