"use client";

import { useState, useEffect } from "react";

const JENKINS = process.env.NEXT_PUBLIC_JENKINS_URL;

type TicketStatus = "Pendiente" | "En progreso" | "Resuelto";
type JenkinsResult = "SUCCESS" | "FAILURE" | "EN_CURSO" | "MANUAL_OK" | "MANUAL_FAIL";

interface Ticket {
  id: string;
  tipo: "Correctivo" | "Perfectivo";
  severidad: "alta" | "media";
  sintoma: string;
  status: TicketStatus;
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "RG-204",
    tipo: "Correctivo",
    severidad: "alta",
    sintoma: "Apliqué el cupón DELI10 tres veces y mi pedido quedó casi gratis.",
    status: "Pendiente",
  },
  {
    id: "RG-205",
    tipo: "Correctivo",
    severidad: "media",
    sintoma: "El total al pagar no cobra el envío; la empresa pierde S/5 por pedido.",
    status: "Pendiente",
  },
  {
    id: "RG-207",
    tipo: "Perfectivo",
    severidad: "media",
    sintoma: "Si busco restaurantes de 'pizza' (en minúscula) no aparece ninguno.",
    status: "Pendiente",
  },
];

const STATUS_CYCLE: TicketStatus[] = ["Pendiente", "En progreso", "Resuelto"];

function statusColor(s: TicketStatus) {
  if (s === "Resuelto") return "text-[#34D399]";
  if (s === "En progreso") return "text-[#FBBF24]";
  return "text-[#94A3B8]";
}

function severityBadge(s: "alta" | "media") {
  return s === "alta"
    ? "bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/40"
    : "bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/40";
}

function tipoBadge(t: "Correctivo" | "Perfectivo") {
  return t === "Correctivo"
    ? "bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/40"
    : "bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40";
}

export default function OpsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [buildNumber, setBuildNumber] = useState<number | null>(null);
  const [jenkinsResult, setJenkinsResult] = useState<JenkinsResult>("EN_CURSO");
  const [jenkinsFailed, setJenkinsFailed] = useState(false);
  const [manualState, setManualState] = useState<"ROJO" | "VERDE">("ROJO");

  useEffect(() => {
    if (!JENKINS) {
      setJenkinsFailed(true);
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(
          `${JENKINS}/job/rapigo-backend/lastBuild/api/json`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("non-ok");
        const data = await res.json();
        setBuildNumber(data.number ?? null);
        if (data.result === "FAILURE") setJenkinsResult("FAILURE");
        else if (data.result === "SUCCESS") setJenkinsResult("SUCCESS");
        else setJenkinsResult("EN_CURSO");
        setJenkinsFailed(false);
      } catch {
        setJenkinsFailed(true);
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  function nextStatus(current: TicketStatus): TicketStatus {
    const idx = STATUS_CYCLE.indexOf(current);
    return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
  }

  function toggleTicket(id: string) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: nextStatus(t.status) } : t
      )
    );
  }

  const resolvedCount = tickets.filter((t) => t.status === "Resuelto").length;
  const techDebt = Math.round(((3 - resolvedCount) / 3) * 100);

  let jenkinsColor = "text-[#FBBF24]";
  let jenkinsLabel = "EN CURSO";
  if (jenkinsFailed) {
    jenkinsColor = manualState === "ROJO" ? "text-[#FB7185]" : "text-[#34D399]";
    jenkinsLabel = manualState === "ROJO" ? "FALLIDO (manual)" : "OK (manual)";
  } else if (jenkinsResult === "FAILURE") {
    jenkinsColor = "text-[#FB7185]";
    jenkinsLabel = "FALLIDO";
  } else if (jenkinsResult === "SUCCESS") {
    jenkinsColor = "text-[#34D399]";
    jenkinsLabel = "EXITOSO";
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-[#E2E8F0] px-4 py-8 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#60A5FA] tracking-tight">
            Centro de Operaciones
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            RapiGo · Tablero de mantenimiento y CI/CD
          </p>
        </div>

        {/* Tickets */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
            Tickets activos
          </h2>
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-[#111A2E] rounded-xl border border-[#1A2540] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono font-bold text-[#60A5FA] text-sm">
                        {ticket.id}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoBadge(ticket.tipo)}`}
                      >
                        {ticket.tipo}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge(ticket.severidad)}`}
                      >
                        Severidad {ticket.severidad}
                      </span>
                    </div>
                    <p className="text-[#E2E8F0] text-sm leading-relaxed">
                      "{ticket.sintoma}"
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`text-xs font-semibold font-mono ${statusColor(ticket.status)}`}
                    >
                      {ticket.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => toggleTicket(ticket.id)}
                      className="text-xs bg-[#1A2540] hover:bg-[#243058] border border-[#2A3A60] text-[#94A3B8] hover:text-[#E2E8F0] px-3 py-1 rounded-lg transition-colors"
                    >
                      Avanzar estado
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Jenkins + KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Jenkins */}
          <div className="bg-[#111A2E] rounded-xl border border-[#1A2540] p-5">
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-widest mb-4">
              Estado Jenkins
            </h2>

            {jenkinsFailed && (
              <div className="mb-3 text-xs text-[#FBBF24] bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-lg px-3 py-2">
                Jenkins no disponible — estado manual activo
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8] text-sm">Pipeline</span>
                <span className="font-mono text-xs">rapigo-backend</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8] text-sm">Build #</span>
                <span className="font-mono font-bold text-[#E2E8F0] text-sm">
                  {buildNumber !== null ? `#${buildNumber}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8] text-sm">Resultado</span>
                <span className={`font-mono font-bold text-sm ${jenkinsColor}`}>
                  {jenkinsLabel}
                </span>
              </div>
            </div>

            {jenkinsFailed && (
              <button
                onClick={() =>
                  setManualState((s) => (s === "ROJO" ? "VERDE" : "ROJO"))
                }
                className="mt-4 w-full text-xs bg-[#1A2540] hover:bg-[#243058] border border-[#2A3A60] text-[#94A3B8] hover:text-[#E2E8F0] px-3 py-2 rounded-lg transition-colors"
              >
                Alternar estado manual (ahora:{" "}
                {manualState === "ROJO" ? "ROJO" : "VERDE"})
              </button>
            )}

            {!jenkinsFailed && (
              <div className="mt-3 text-xs text-[#94A3B8]">
                Polling cada 5 s
              </div>
            )}
          </div>

          {/* KPIs */}
          <div className="bg-[#111A2E] rounded-xl border border-[#1A2540] p-5">
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-widest mb-4">
              KPIs
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#94A3B8]">Último build</span>
                  <span className={`font-mono font-bold ${jenkinsColor}`}>
                    {jenkinsLabel}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#94A3B8]">Pruebas (pasan / total)</span>
                  <span className="font-mono font-bold text-[#FB7185]">
                    0 / 3
                  </span>
                </div>
                <div className="text-xs text-[#94A3B8]">
                  3 pruebas fallan — bugs intencionales RG-204, RG-205, RG-207
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#94A3B8]">Deuda técnica</span>
                  <span className="font-mono font-bold text-[#FBBF24]">
                    {techDebt}%
                  </span>
                </div>
                <div className="w-full bg-[#1A2540] rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#FBBF24] transition-all duration-500"
                    style={{ width: `${techDebt}%` }}
                  />
                </div>
                <div className="text-xs text-[#94A3B8] mt-1">
                  {resolvedCount} de 3 tickets resueltos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
