
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient, isSupabaseConfigurado } from "./lib/supabase";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const ABAS = ["Hoje", "Semana", "Guia", "Conta e sincronizacao", "Backup e restauracao", "Historico"];
const CHAVE_MARCADAS = "pc-doses-marcadas-v3";
const CHAVE_PROTOCOLO = "pc-protocolo-v1";
const CHAVE_PREFS = "pc-preferencias-v1";
const CHAVE_MIGRACOES = "pc-migracoes-v1";
const CHAVE_ANTIGA = "doses-marcadas-v2";
const CHAVE_ULTIMO_LEMBRETE = "pc-ultimo-lembrete";
const MOTSC_INICIO_PADRAO = "2026-04-27";
const MOTSC_FIM_PADRAO = "2026-07-03";

function criarBhenaPadrao() {
  return {
    id: "bhena",
    nome: "BHENA",
    dose: "1 comprimido",
    horario: "Manha",
    emoji: "💊",
    cor: "#9A3412",
    corFundo: "#FFF7ED",
    corBorda: "#FED7AA",
    diasSemana: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"],
    agendaTipo: "semanal",
    intervaloDias: null,
    descricao: "1 comprimido diario por via oral.",
    reconstituicao: "Via oral",
    unidades: null,
    dataInicio: "",
    dataFim: "",
  };
}

function criarClomifenoPadrao() {
  return {
    id: "clomifeno",
    nome: "Clomifeno",
    dose: "50mg",
    horario: "Manha",
    emoji: "🧪",
    cor: "#B45309",
    corFundo: "#FFFBEB",
    corBorda: "#FDE68A",
    diasSemana: [],
    agendaTipo: "intervalo",
    intervaloDias: 2,
    descricao: "Administracao oral em dias alternados.",
    reconstituicao: "Via oral",
    unidades: null,
    dataInicio: "2026-04-27",
    dataFim: "",
  };
}

const PROTOCOLO_PADRAO = [
  {
    id: "retatrutida",
    nome: "Retatrutida",
    dose: "5mg",
    horario: "Manha (jejum)",
    emoji: "💉",
    cor: "#EA580C",
    corFundo: "#FFF7ED",
    corBorda: "#FED7AA",
    diasSemana: ["Dom"],
    descricao: "SC em abdomen ou coxa. Rodar local a cada semana.",
    reconstituicao: "Conforme apresentacao original",
    unidades: null,
    dataInicio: "",
    dataFim: "",
  },
  {
    id: "motsc",
    nome: "MOTS-c",
    dose: "5mg",
    horario: "Manha",
    emoji: "⚡",
    cor: "#7C3AED",
    corFundo: "#F5F3FF",
    corBorda: "#DDD6FE",
    diasSemana: ["Seg", "Qua", "Sex"],
    descricao: "5mg por aplicacao, 3x por semana por 4 semanas, pausa 2 e repete por mais 4.",
    reconstituicao: "Conforme apresentacao utilizada",
    unidades: null,
    dataInicio: MOTSC_INICIO_PADRAO,
    dataFim: MOTSC_FIM_PADRAO,
  },
  {
    id: "bpc157",
    nome: "BPC-157",
    dose: "250mcg",
    horario: "Manha em jejum ou pos-treino",
    emoji: "🛡️",
    cor: "#15803D",
    corFundo: "#F0FDF4",
    corBorda: "#BBF7D0",
    diasSemana: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"],
    descricao: "Pode aplicar perto de dores ou lesoes.",
    reconstituicao: "5mg + 1ml BAC Water",
    unidades: 5,
    dataInicio: "",
    dataFim: "",
  },
  {
    id: "ipamorelin",
    nome: "Ipamorelin",
    dose: "200mcg",
    horario: "Noite, antes de dormir",
    emoji: "🌙",
    cor: "#1D4ED8",
    corFundo: "#EFF6FF",
    corBorda: "#BFDBFE",
    diasSemana: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"],
    descricao: "Jejum de 2h antes. Sincroniza com GH.",
    reconstituicao: "5mg + 1ml BAC Water",
    unidades: 4,
    dataInicio: "",
    dataFim: "",
  },
  criarBhenaPadrao(),
  criarClomifenoPadrao(),
];

const PREFS_PADRAO = {
  nome: "Jonathan",
  fonteGrande: false,
  altoContraste: false,
  lembretesAtivos: false,
  horariosLembrete: {
    manha: "08:00",
    noite: "21:30",
  },
};

const TEMA_PADRAO = {
  fundo: "#F1F5F9",
  superficie: "#FFFFFF",
  borda: "#E2E8F0",
  texto: "#0F172A",
  textoSuave: "#64748B",
  cabecalho: "#0F172A",
  destaque: "#3B82F6",
  sucesso: "#16A34A",
  alerta: "#B45309",
};

const TEMA_ALTO_CONTRASTE = {
  fundo: "#FFFFFF",
  superficie: "#FFFFFF",
  borda: "#000000",
  texto: "#000000",
  textoSuave: "#111827",
  cabecalho: "#000000",
  destaque: "#0047FF",
  sucesso: "#007A00",
  alerta: "#7A2E00",
};

const FASES_DIARIO = [
  {
    id: "tirz-f1",
    titulo: "Fase 1 - Inicio e adaptacao",
    subtitulo: "Tirzepatida 2,5 mg",
    medicacao: "TG (Indufar)",
    resumo: "Inicio do protocolo com 3 aplicacoes e perda de peso inicial consistente.",
    destaque: "#EA580C",
  },
  {
    id: "tirz-f2",
    titulo: "Fase 2 - Aumento de dose",
    subtitulo: "Tirzepatida 5,0 mg",
    medicacao: "TG (Indufar)",
    resumo: "Escalada para 5 mg com cinco aplicacoes na fase de ajuste.",
    destaque: "#F97316",
  },
  {
    id: "tirz-f3",
    titulo: "Fase 3 - Troca de marca",
    subtitulo: "Tirzepatida 5,0 mg",
    medicacao: "TIRZEC (Quimfa)",
    resumo: "Troca de fornecedor mantendo 5 mg e continuidade da queda ponderal.",
    destaque: "#FB923C",
  },
  {
    id: "tirz-f4",
    titulo: "Fase 4 - Ajustes e continuidade",
    subtitulo: "Tirzepatida com dose variada",
    medicacao: "TG / TIRZEC",
    resumo: "Fase curta de ajuste entre 2,5 mg e 5,0 mg.",
    destaque: "#FDBA74",
  },
  {
    id: "tirz-f5",
    titulo: "Fase 5 - Novo aumento de dose",
    subtitulo: "Tirzepatida 7,5 mg",
    medicacao: "TIRZEC (Quimfa)",
    resumo: "Elevacao para 7,5 mg antes do encerramento da tirzepatida.",
    destaque: "#C2410C",
  },
  {
    id: "washout",
    titulo: "Fase 6 - Washout",
    subtitulo: "Sem medicacao",
    medicacao: "Intervalo de 07/01/2026 a 11/01/2026",
    resumo: "Pausa completa do protocolo. Peso medio informado: 105-106 kg.",
    destaque: "#64748B",
    tipo: "washout",
    periodo: "07/01/2026 a 11/01/2026",
  },
  {
    id: "reta-f7",
    titulo: "Fase 7 - Retatrutida",
    subtitulo: "Recomposicao metabolica",
    medicacao: "Synedica / Xingruida / outros fornecedores",
    resumo: "Migracao para retatrutida com subida progressiva de dose ate 5 mg.",
    destaque: "#0F766E",
  },
];

const HISTORICO_CLINICO = [
  {
    aplicacao: 1,
    data: "2025-10-06",
    faseId: "tirz-f1",
    composto: "Tirzepatida",
    medicacao: "TG (Indufar)",
    dose: "2,5 mg",
    peso: "115,50 kg",
    variacao: "",
    observacoes: "Inicio do protocolo.",
  },
  {
    aplicacao: 2,
    data: "2025-10-12",
    faseId: "tirz-f1",
    composto: "Tirzepatida",
    medicacao: "TG (Indufar)",
    dose: "2,5 mg",
    peso: "113,85 kg",
    variacao: "-1,65 kg",
    observacoes: "",
  },
  {
    aplicacao: 3,
    data: "2025-10-18",
    faseId: "tirz-f1",
    composto: "Tirzepatida",
    medicacao: "TG (Indufar)",
    dose: "2,5 mg",
    peso: "113,30 kg",
    variacao: "-0,55 kg",
    observacoes: "",
  },
  {
    aplicacao: 4,
    data: "2025-10-24",
    faseId: "tirz-f2",
    composto: "Tirzepatida",
    medicacao: "TG (Indufar)",
    dose: "5,0 mg",
    peso: "111,25 kg",
    variacao: "-2,05 kg",
    observacoes: "",
  },
  {
    aplicacao: 5,
    data: "2025-10-31",
    faseId: "tirz-f2",
    composto: "Tirzepatida",
    medicacao: "TG (Indufar)",
    dose: "5,0 mg",
    peso: "110,80 kg",
    variacao: "-0,45 kg",
    observacoes: "",
  },
  {
    aplicacao: 6,
    data: "2025-11-07",
    faseId: "tirz-f2",
    composto: "Tirzepatida",
    medicacao: "TG (Indufar)",
    dose: "5,0 mg",
    peso: "109,70 kg",
    variacao: "-1,10 kg",
    observacoes: "",
  },
  {
    aplicacao: 7,
    data: "2025-11-13",
    faseId: "tirz-f2",
    composto: "Tirzepatida",
    medicacao: "TG (Indufar)",
    dose: "5,0 mg",
    peso: "109,50 kg",
    variacao: "-0,20 kg",
    observacoes: "",
  },
  {
    aplicacao: 8,
    data: "2025-11-20",
    faseId: "tirz-f2",
    composto: "Tirzepatida",
    medicacao: "TG (Indufar)",
    dose: "5,0 mg",
    peso: "108,80 kg",
    variacao: "-0,70 kg",
    observacoes: "",
  },
  {
    aplicacao: 9,
    data: "2025-11-26",
    faseId: "tirz-f3",
    composto: "Tirzepatida",
    medicacao: "TIRZEC (Quimfa)",
    dose: "5,0 mg",
    peso: "108,30 kg",
    variacao: "-0,50 kg",
    observacoes: "",
  },
  {
    aplicacao: 10,
    data: "2025-12-04",
    faseId: "tirz-f3",
    composto: "Tirzepatida",
    medicacao: "TIRZEC (Quimfa)",
    dose: "5,0 mg",
    peso: "108,20 kg",
    variacao: "-0,10 kg",
    observacoes: "",
  },
  {
    aplicacao: 11,
    data: "2025-12-11",
    faseId: "tirz-f3",
    composto: "Tirzepatida",
    medicacao: "TIRZEC (Quimfa)",
    dose: "5,0 mg",
    peso: "106,25 kg",
    variacao: "-1,95 kg",
    observacoes: "",
  },
  {
    aplicacao: 12,
    data: "2025-12-15",
    faseId: "tirz-f4",
    composto: "Tirzepatida",
    medicacao: "TG (Indufar)",
    dose: "2,5 mg",
    peso: "107,75 kg",
    variacao: "",
    observacoes: "Ajuste de dose.",
  },
  {
    aplicacao: 13,
    data: "2025-12-17",
    faseId: "tirz-f4",
    composto: "Tirzepatida",
    medicacao: "TG (Indufar)",
    dose: "5,0 mg",
    peso: "106,60 kg",
    variacao: "",
    observacoes: "Continuidade do ajuste.",
  },
  {
    aplicacao: 14,
    data: "2025-12-23",
    faseId: "tirz-f4",
    composto: "Tirzepatida",
    medicacao: "TIRZEC (Quimfa)",
    dose: "5,0 mg",
    peso: "107,10 kg",
    variacao: "",
    observacoes: "Troca de marca dentro da fase de ajuste.",
  },
  {
    aplicacao: 15,
    data: "2025-12-28",
    faseId: "tirz-f5",
    composto: "Tirzepatida",
    medicacao: "TIRZEC (Quimfa)",
    dose: "7,5 mg",
    peso: "106,80 kg",
    variacao: "",
    observacoes: "Primeira aplicacao em 7,5 mg.",
  },
  {
    aplicacao: 16,
    data: "2026-01-04",
    faseId: "tirz-f5",
    composto: "Tirzepatida",
    medicacao: "TIRZEC (Quimfa)",
    dose: "7,5 mg",
    peso: "106,65 kg",
    variacao: "",
    observacoes: "Encerramento da tirzepatida.",
  },
  {
    aplicacao: 17,
    data: "2026-01-12",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Synedica",
    dose: "2,5 mg",
    peso: "106,10 kg",
    variacao: "",
    observacoes: "Inicio da retatrutida.",
  },
  {
    aplicacao: 18,
    data: "2026-01-18",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Synedica",
    dose: "2,5 mg",
    peso: "105,10 kg",
    variacao: "",
    observacoes: "",
  },
  {
    aplicacao: 19,
    data: "2026-01-24",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Synedica",
    dose: "2,5 mg",
    peso: "103,90 kg",
    variacao: "",
    observacoes: "",
  },
  {
    aplicacao: 20,
    data: "2026-01-27",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Synedica",
    dose: "2,5 mg",
    peso: "103,70 kg",
    variacao: "",
    observacoes: "",
  },
  {
    aplicacao: 21,
    data: "2026-01-30",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Synedica",
    dose: "2,5 mg",
    peso: "104,00 kg",
    variacao: "",
    observacoes: "",
  },
  {
    aplicacao: 22,
    data: "2026-02-02",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Novo fornecedor - China",
    dose: "2,5 mg",
    peso: "103,55 kg",
    variacao: "",
    observacoes: "",
  },
  {
    aplicacao: 23,
    data: "2026-02-09",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Synedica",
    dose: "5,0 mg",
    peso: "~102,35 kg",
    variacao: "",
    observacoes: "Primeira aplicacao oficial de 5 mg Synedica.",
  },
  {
    aplicacao: 24,
    data: "2026-02-17",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Synedica",
    dose: "5,0 mg",
    peso: "103,90 kg",
    variacao: "",
    observacoes: "Aplicacao realizada apos o carnaval.",
  },
  {
    aplicacao: 25,
    data: "2026-02-23",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Xingruida",
    dose: "2,5 mg",
    peso: "102,90 kg",
    variacao: "",
    observacoes: "Troca pontual de fornecedor.",
  },
  {
    aplicacao: 26,
    data: "2026-03-02",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Xingruida",
    dose: "5,0 mg",
    peso: "101,40 kg",
    variacao: "",
    observacoes: "",
  },
  {
    aplicacao: 27,
    data: "2026-03-09",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Xingruida",
    dose: "5,0 mg",
    peso: "99,45 kg",
    variacao: "",
    observacoes: "",
  },
  {
    aplicacao: 28,
    data: "2026-03-15",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Xingruida",
    dose: "5,0 mg",
    peso: "98,50 kg",
    variacao: "",
    observacoes: "",
  },
  {
    aplicacao: 29,
    data: "2026-03-22",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Xingruida",
    dose: "5,0 mg",
    peso: "98,15 kg",
    variacao: "",
    observacoes: "",
  },
  {
    aplicacao: 30,
    data: "2026-03-29",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Xingruida",
    dose: "5,0 mg",
    peso: "97,85 kg",
    variacao: "",
    observacoes: "",
  },
  {
    aplicacao: 31,
    data: "2026-04-05",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Fornecedor nao informado",
    dose: "2,5 mg",
    peso: "96,40 kg",
    variacao: "",
    observacoes: "Aplicacao de ajuste para 2,5 mg.",
  },
  {
    aplicacao: 32,
    data: "2026-04-12",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Fornecedor nao informado",
    dose: "5,0 mg",
    peso: "Nao informado",
    variacao: "",
    observacoes: "Aplicacao adicionada sem peso registrado.",
  },
  {
    aplicacao: 33,
    data: "2026-04-19",
    faseId: "reta-f7",
    composto: "Retatrutida",
    medicacao: "Fornecedor nao informado",
    dose: "5,0 mg",
    peso: "96,00 kg",
    variacao: "",
    observacoes: "Aplicacao mais recente com peso atual informado.",
  },
];

const NOTAS_CLINICAS = {
  situacaoTitulo: "Situacao atual do protocolo (anotacao informada em 27/02)",
  situacao: [
    "Tirzepatida: 16 aplicacoes registradas, da 1a a 16a.",
    "Retatrutida: ciclo descrito da 17a a 35a aplicacao, com 17a a 22a em 2,5 mg, 23a e 24a em 5 mg, 25a em 2,5 mg e 26a a 35a planejadas em 5 mg.",
  ],
  linhaTempo: [
    "Out/2025: inicio em 115,5 kg.",
    "Jan/2026: transicao para retatrutida em torno de 106 kg.",
    "Fev/2026: consolidacao em ~102-104 kg.",
    "Mar/2026 em diante: fase de 5 mg estavel.",
  ],
  faseAtual: "Retatrutida 5 mg - fase de consolidacao metabolica.",
  objetivos: [
    "Reducao de gordura visceral.",
    "Queda progressiva da insulina basal.",
    "Preservacao de massa magra.",
    "Ajuste hemodinamico.",
    "Saida da faixa ~30% BF em direcao a <25%.",
  ],
  evolucaoGlobal: [
    "Peso inicial registrado: 115,5 kg.",
    "Peso atual informado: 96,0 kg.",
    "Reducao total aproximada desde a 1a aplicacao: -19,5 kg.",
    "Reducao aproximada desde o pico de 117,6 kg: -21,6 kg.",
  ],
};

function pad2(v) {
  return String(v).padStart(2, "0");
}

function toDateStr(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function hoje() {
  return toDateStr(new Date());
}

function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(dateStr, days) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

function formatarData(dateStr) {
  const d = parseDate(dateStr);
  return `${d.getDate()} de ${MESES[d.getMonth()]}`;
}

function formatarDataCurta(dateStr) {
  const d = parseDate(dateStr);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatarDataHora(dateLike) {
  const d = dateLike ? new Date(dateLike) : new Date();
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatarDataHoraAtual() {
  return formatarDataHora(new Date());
}

function inicioSemana(dateStr) {
  const d = parseDate(dateStr);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

function semana7(inicioStr) {
  return Array.from({ length: 7 }, (_, i) => addDays(inicioStr, i));
}

function formatarSemana(inicioStr) {
  const fimStr = addDays(inicioStr, 6);
  const di = parseDate(inicioStr);
  const df = parseDate(fimStr);
  if (di.getMonth() === df.getMonth()) {
    return `${di.getDate()} - ${df.getDate()} de ${MESES[df.getMonth()]} ${df.getFullYear()}`;
  }
  return `${di.getDate()} ${MESES[di.getMonth()]} - ${df.getDate()} ${MESES[df.getMonth()]} ${df.getFullYear()}`;
}

function inferirPeriodo(horario) {
  const base = (horario || "").toLowerCase();
  if (base.includes("noite")) return "noite";
  return "manha";
}

function formatarAgendaDose(dose) {
  if (dose?.agendaTipo === "intervalo") {
    const intervalo = Math.max(Number(dose.intervaloDias) || 1, 1);
    if (intervalo === 1) return "Todo dia";
    if (intervalo === 2) return "Dias alternados";
    return `A cada ${intervalo} dias`;
  }
  return dose?.diasSemana?.length === 7 ? "Todo dia" : (dose?.diasSemana || []).join(", ");
}

function sanitizarDose(dose) {
  const agendaTipo = dose?.agendaTipo === "intervalo" ? "intervalo" : "semanal";
  const intervaloBase = Number(dose?.intervaloDias);
  return {
    ...dose,
    diasSemana: Array.isArray(dose.diasSemana) ? dose.diasSemana : [],
    agendaTipo,
    intervaloDias: agendaTipo === "intervalo" ? Math.max(Number.isFinite(intervaloBase) ? intervaloBase : 2, 1) : null,
    dataInicio: typeof dose.dataInicio === "string" ? dose.dataInicio : "",
    dataFim: typeof dose.dataFim === "string" ? dose.dataFim : "",
  };
}

function normalizarPrefs(base = {}) {
  return {
    ...PREFS_PADRAO,
    ...base,
    horariosLembrete: {
      ...PREFS_PADRAO.horariosLembrete,
      ...(base?.horariosLembrete || {}),
    },
  };
}

function isMotscAntigo(dose) {
  return (
    dose?.id === "motsc" &&
    dose.dose === "400mcg" &&
    dose.horario === "Manha, antes do treino"
  );
}

function atualizarMotscSeAntigo(protocolo) {
  return protocolo.map((dose) => {
    if (!isMotscAntigo(dose)) return dose;
    return {
      ...dose,
      dose: "5mg",
      horario: "Manha",
      diasSemana: ["Seg", "Qua", "Sex"],
      descricao: "5mg por aplicacao, 3x por semana por 4 semanas, pausa 2 e repete por mais 4.",
      reconstituicao: "Conforme apresentacao utilizada",
      unidades: null,
      dataInicio: MOTSC_INICIO_PADRAO,
      dataFim: MOTSC_FIM_PADRAO,
    };
  });
}

function aplicarPeriodoPadraoMotscSeAusente(protocolo) {
  return protocolo.map((dose) => {
    if (dose?.id !== "motsc") return dose;
    if (dose.dataInicio || dose.dataFim) return dose;
    return {
      ...dose,
      dataInicio: MOTSC_INICIO_PADRAO,
      dataFim: MOTSC_FIM_PADRAO,
    };
  });
}

function doseAtivaNaData(dose, dateStr) {
  if (dose.dataInicio && dateStr < dose.dataInicio) return false;
  if (dose.dataFim && dateStr > dose.dataFim) return false;
  return true;
}

function formatarPeriodoDose(dose) {
  if (!dose.dataInicio && !dose.dataFim) return "Sem data limite";
  if (dose.dataInicio && dose.dataFim) {
    return `${formatarData(dose.dataInicio)} ate ${formatarData(dose.dataFim)}`;
  }
  if (dose.dataInicio) return `A partir de ${formatarData(dose.dataInicio)}`;
  return `Ate ${formatarData(dose.dataFim)}`;
}

function doseProgramadaNaData(dose, dateStr) {
  if (dose.agendaTipo === "intervalo") {
    const dataBase = dose.dataInicio || dateStr;
    if (dateStr < dataBase) return false;
    const intervalo = Math.max(Number(dose.intervaloDias) || 1, 1);
    const diffDias = Math.round((parseDate(dateStr).getTime() - parseDate(dataBase).getTime()) / 86400000);
    return diffDias % intervalo === 0;
  }
  const dia = DIAS_SEMANA[parseDate(dateStr).getDay()];
  return dose.diasSemana.includes(dia);
}

function garantirItensPadraoEssenciais(protocolo) {
  const proximo = [...protocolo];
  if (!proximo.some((dose) => dose.id === "bhena")) proximo.push(criarBhenaPadrao());
  if (!proximo.some((dose) => dose.id === "clomifeno")) proximo.push(criarClomifenoPadrao());
  return proximo.map(sanitizarDose);
}

function normalizarProtocolo(protocolo) {
  return aplicarPeriodoPadraoMotscSeAusente(atualizarMotscSeAntigo(protocolo)).map(sanitizarDose);
}

function getDosesParaDia(dateStr, protocolo) {
  return protocolo.filter((dose) => doseAtivaNaData(dose, dateStr) && doseProgramadaNaData(dose, dateStr));
}

async function salvarStorage(chave, valor) {
  const serializado = typeof valor === "string" ? valor : JSON.stringify(valor);
  try {
    localStorage.setItem(chave, serializado);
  } catch (_) {}
}

async function carregarStorage(chave) {
  try {
    return localStorage.getItem(chave);
  } catch (_) {
    return null;
  }
}

function montarPayloadNuvem({ marcadas, protocolo, prefs, migracoes }) {
  return {
    versao: 1,
    salvoEm: new Date().toISOString(),
    marcadas,
    protocolo,
    preferencias: prefs,
    migracoes,
  };
}

function normalizarEstadoNuvem(payload) {
  const protocoloBase =
    Array.isArray(payload?.protocolo) && payload.protocolo.length > 0 ? payload.protocolo : PROTOCOLO_PADRAO;

  return {
    marcadas: payload?.marcadas && typeof payload.marcadas === "object" ? payload.marcadas : {},
    protocolo: garantirItensPadraoEssenciais(normalizarProtocolo(protocoloBase)),
    prefs: normalizarPrefs(payload?.preferencias || {}),
    migracoes: payload?.migracoes && typeof payload.migracoes === "object" ? payload.migracoes : {},
  };
}

function downloadArquivo(nome, conteudo, mime) {
  const blob = new Blob([conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

function montarMetricas(inicioStr, fimStr, protocolo, marcadas, hojeStr) {
  let total = 0;
  let feitas = 0;
  let data = inicioStr;

  while (data <= fimStr && data <= hojeStr) {
    const doses = getDosesParaDia(data, protocolo);
    total += doses.length;
    for (const dose of doses) {
      if (marcadas[`${data}-${dose.id}`]) feitas += 1;
    }
    data = addDays(data, 1);
  }

  const pct = total ? Math.round((feitas / total) * 100) : 0;
  return { total, feitas, pct };
}

function montarHistoricoAplicacoes(marcadas, protocolo) {
  return Object.entries(marcadas)
    .filter(([, aplicada]) => !!aplicada)
    .map(([chave]) => {
      const [y, m, d, ...resto] = chave.split("-");
      const data = `${y}-${m}-${d}`;
      const doseId = resto.join("-");
      const dose = protocolo.find((item) => item.id === doseId);

      return {
        data,
        nome: dose?.nome || "Desconhecida",
        dose: dose?.dose || "-",
        horario: dose?.horario || "-",
        dias: dose ? formatarAgendaDose(dose) : "-",
        periodo: dose ? formatarPeriodoDose(dose) : "-",
        descricao: dose?.descricao || "-",
      };
    })
    .sort((a, b) => {
      if (a.data !== b.data) return b.data.localeCompare(a.data);
      return a.nome.localeCompare(b.nome);
    });
}

function montarResumoPorPeptideo(historico) {
  const acumulado = historico.reduce((acc, item) => {
    acc[item.nome] = (acc[item.nome] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(acumulado)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
}

function parsePesoKg(texto) {
  const match = String(texto || "")
    .replace("kg", "")
    .replace("~", "")
    .match(/(\d+(?:[.,]\d+)?)/);
  return match ? Number(match[1].replace(",", ".")) : null;
}

function formatarDeltaPeso(valor) {
  if (valor == null) return "-";
  const prefixo = valor > 0 ? "+" : "";
  return `${prefixo}${valor.toFixed(2).replace(".", ",")} kg`;
}

function montarResumoClinico(registros) {
  const ordenados = [...registros].sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.aplicacao - b.aplicacao;
  });
  const comPeso = ordenados.filter((item) => parsePesoKg(item.peso) != null);
  const porComposto = ordenados.reduce((acc, item) => {
    acc[item.composto] = (acc[item.composto] || 0) + 1;
    return acc;
  }, {});
  const primeiro = ordenados[0] || null;
  const ultimo = ordenados[ordenados.length - 1] || null;
  const primeiroComPeso = comPeso[0] || null;
  const ultimoComPeso = comPeso[comPeso.length - 1] || null;
  const pesoInicial = parsePesoKg(primeiroComPeso?.peso);
  const pesoAtual = parsePesoKg(ultimoComPeso?.peso);
  const variacaoRegistrada = pesoInicial != null && pesoAtual != null ? pesoAtual - pesoInicial : null;

  return {
    total: ordenados.length,
    tirzepatida: porComposto.Tirzepatida || 0,
    retatrutida: porComposto.Retatrutida || 0,
    primeiro,
    ultimo,
    primeiroComPeso,
    ultimoComPeso,
    variacaoRegistrada,
    variacaoRegistradaTexto: formatarDeltaPeso(variacaoRegistrada),
  };
}

function montarFasesClinicas(registros) {
  return FASES_DIARIO.map((fase) => {
    const itens = registros.filter((item) => item.faseId === fase.id);
    const inicio = itens[0]?.data || "";
    const fim = itens[itens.length - 1]?.data || "";
    const periodoExibicao = fase.periodo || (inicio && fim ? `${formatarDataCurta(inicio)} a ${formatarDataCurta(fim)}` : "-");
    return {
      ...fase,
      totalAplicacoes: itens.length,
      periodoExibicao,
    };
  });
}

function gerarCor(index) {
  const paleta = [
    ["#0F766E", "#ECFEFF", "#99F6E4"],
    ["#1D4ED8", "#EFF6FF", "#BFDBFE"],
    ["#A16207", "#FFFBEB", "#FDE68A"],
    ["#BE123C", "#FFF1F2", "#FECDD3"],
    ["#6D28D9", "#F5F3FF", "#DDD6FE"],
  ];
  return paleta[index % paleta.length];
}

export default function App() {
  const [aba, setAba] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [protocolo, setProtocolo] = useState(PROTOCOLO_PADRAO);
  const [marcadas, setMarcadas] = useState({});
  const [prefs, setPrefs] = useState(PREFS_PADRAO);
  const [migracoes, setMigracoes] = useState({});
  const [dataSelecionada, setDataSelecionada] = useState(hoje());
  const [semanaAtual, setSemanaAtual] = useState(inicioSemana(hoje()));
  const [ultimaAcao, setUltimaAcao] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [editandoProtocolo, setEditandoProtocolo] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [sessao, setSessao] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authSenha, setAuthSenha] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [syncStatus, setSyncStatus] = useState("Modo local ativo.");
  const [sincronizandoNuvem, setSincronizandoNuvem] = useState(false);
  const [nuvemPronta, setNuvemPronta] = useState(false);
  const [ultimaSyncEm, setUltimaSyncEm] = useState("");
  const [modoRecuperacaoSenha, setModoRecuperacaoSenha] = useState(false);
  const [importandoBackup, setImportandoBackup] = useState(false);
  const [nomeArquivoImportado, setNomeArquivoImportado] = useState("");
  const inputBackupRef = useRef(null);

  const dataHoje = hoje();
  const tema = prefs.altoContraste ? TEMA_ALTO_CONTRASTE : TEMA_PADRAO;
  const supabaseConfigurado = useMemo(() => isSupabaseConfigurado(), []);
  const supabase = useMemo(() => getSupabaseClient(), [supabaseConfigurado]);

  const carregarEstadoDaNuvem = useCallback(
    async (userId) => {
      if (!supabaseConfigurado || !supabase || !userId) return false;

      setSincronizandoNuvem(true);
      try {
        const { data, error } = await supabase
          .from("calendar_state")
          .select("payload, updated_at")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;

        if (data?.payload) {
          const estado = normalizarEstadoNuvem(data.payload);
          setMarcadas(estado.marcadas);
          setProtocolo(estado.protocolo);
          setPrefs(estado.prefs);
          setMigracoes(estado.migracoes);
          setUltimaSyncEm(data.updated_at || "");
          setSyncStatus(
            data.updated_at ? `Nuvem carregada em ${formatarDataHora(data.updated_at)}.` : "Nuvem carregada."
          );
        } else {
          setUltimaSyncEm("");
          setSyncStatus("Conta conectada. Nenhum backup remoto encontrado ainda. Clique em 'Sincronizar agora'.");
        }

        setNuvemPronta(true);
        return true;
      } catch (error) {
        console.error("Falha ao carregar estado da nuvem", error);
        setSyncStatus("Falha ao carregar a nuvem. Mantendo dados locais.");
        setNuvemPronta(true);
        return false;
      } finally {
        setSincronizandoNuvem(false);
      }
    },
    [supabase, supabaseConfigurado]
  );

  const salvarEstadoNaNuvem = useCallback(
    async (payloadCustomizado = null) => {
      if (!supabaseConfigurado || !supabase || !sessao?.user?.id) return false;

      const payload = payloadCustomizado || montarPayloadNuvem({ marcadas, protocolo, prefs, migracoes });

      setSincronizandoNuvem(true);
      try {
        const agoraIso = new Date().toISOString();
        const { error } = await supabase
          .from("calendar_state")
          .upsert(
            {
              user_id: sessao.user.id,
              payload,
              updated_at: agoraIso,
            },
            { onConflict: "user_id" }
          );

        if (error) throw error;

        setUltimaSyncEm(agoraIso);
        setSyncStatus(`Sincronizado em ${formatarDataHora(agoraIso)}.`);
        return true;
      } catch (error) {
        console.error("Falha ao salvar estado na nuvem", error);
        setSyncStatus("Falha ao sincronizar com a nuvem. Dados locais preservados.");
        return false;
      } finally {
        setSincronizandoNuvem(false);
      }
    },
    [marcadas, migracoes, prefs, protocolo, sessao, supabase, supabaseConfigurado]
  );

  useEffect(() => {
    let ativo = true;

    async function carregarTudo() {
      const [rawMarcadas, rawAntigo, rawProtocolo, rawPrefs, rawMigracoes] = await Promise.all([
        carregarStorage(CHAVE_MARCADAS),
        carregarStorage(CHAVE_ANTIGA),
        carregarStorage(CHAVE_PROTOCOLO),
        carregarStorage(CHAVE_PREFS),
        carregarStorage(CHAVE_MIGRACOES),
      ]);

      if (!ativo) return;

      try {
        if (rawMarcadas) {
          setMarcadas(JSON.parse(rawMarcadas));
        } else if (rawAntigo) {
          setMarcadas(JSON.parse(rawAntigo));
        }
      } catch (_) {}

      try {
        if (rawProtocolo) {
          const carregado = normalizarProtocolo(JSON.parse(rawProtocolo));
          if (Array.isArray(carregado) && carregado.length > 0) {
            setProtocolo(carregado);
          }
        }
      } catch (_) {}

      try {
        if (rawPrefs) {
          const carregado = JSON.parse(rawPrefs);
          setPrefs(normalizarPrefs(carregado));
        }
      } catch (_) {}

      try {
        if (rawMigracoes) {
          setMigracoes(JSON.parse(rawMigracoes));
        }
      } catch (_) {}

      setCarregando(false);
    }

    carregarTudo();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!carregando) salvarStorage(CHAVE_MARCADAS, marcadas);
  }, [marcadas, carregando]);

  useEffect(() => {
    if (!carregando) salvarStorage(CHAVE_PROTOCOLO, protocolo);
  }, [protocolo, carregando]);

  useEffect(() => {
    if (!carregando) salvarStorage(CHAVE_PREFS, prefs);
  }, [prefs, carregando]);

  useEffect(() => {
    if (!carregando) salvarStorage(CHAVE_MIGRACOES, migracoes);
  }, [migracoes, carregando]);

  useEffect(() => {
    if (!supabaseConfigurado || !supabase) {
      setSyncStatus("Supabase nao configurado. O app segue em modo local.");
      setNuvemPronta(false);
      return undefined;
    }

    let ativo = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!ativo) return;

      if (error) {
        console.error("Falha ao recuperar sessao do Supabase", error);
        setSyncStatus("Falha ao iniciar o Supabase. O app segue em modo local.");
        setNuvemPronta(false);
        return;
      }

      const session = data.session ?? null;
      setSessao(session);

      if (window.location.hash.includes("type=recovery")) {
        setModoRecuperacaoSenha(true);
        setAba(3);
        setSyncStatus("Link de recuperacao detectado. Defina sua nova senha.");
        setNuvemPronta(true);
        return;
      }

      if (session?.user?.id) {
        setSyncStatus("Conta conectada. Carregando nuvem...");
        void carregarEstadoDaNuvem(session.user.id);
      } else {
        setNuvemPronta(true);
        setSyncStatus("Entre para sincronizar seus dados com a nuvem.");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!ativo) return;

      setSessao(session ?? null);

      if (event === "PASSWORD_RECOVERY") {
        setModoRecuperacaoSenha(true);
        setAba(3);
        setNuvemPronta(true);
        setSyncStatus("Link de recuperacao validado. Escolha sua nova senha.");
        return;
      }

      if (event === "SIGNED_OUT") {
        setNuvemPronta(false);
        setUltimaSyncEm("");
        setModoRecuperacaoSenha(false);
        setSyncStatus("Sessao encerrada. Modo local ativo.");
        return;
      }

      if (session?.user?.id) {
        setModoRecuperacaoSenha(false);
        setSyncStatus("Conta conectada. Carregando nuvem...");
        setTimeout(() => {
          if (ativo) void carregarEstadoDaNuvem(session.user.id);
        }, 0);
      }
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, [carregarEstadoDaNuvem, supabase, supabaseConfigurado]);

  useEffect(() => {
    if (carregando) return;
    const precisaMigrar = protocolo.some(
      (dose) => isMotscAntigo(dose) || (dose?.id === "motsc" && !dose.dataInicio && !dose.dataFim)
    );
    if (!precisaMigrar) return;
    setProtocolo((prev) => normalizarProtocolo(prev));
    setMensagem("Protocolo do MOTS-c atualizado.");
  }, [carregando, protocolo]);

  useEffect(() => {
    if (carregando || migracoes.protocoloAbr2026) return;
    const faltandoBhena = !protocolo.some((dose) => dose.id === "bhena");
    const faltandoClomifeno = !protocolo.some((dose) => dose.id === "clomifeno");

    if (faltandoBhena || faltandoClomifeno) {
      setProtocolo((prev) => garantirItensPadraoEssenciais(prev));
      setMensagem("BHENA e Clomifeno adicionados ao protocolo.");
    }

    setMigracoes((prev) => ({ ...prev, protocoloAbr2026: true }));
  }, [carregando, migracoes.protocoloAbr2026, protocolo]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
      return;
    }
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  }, []);

  useEffect(() => {
    function capturarInstallPrompt(ev) {
      ev.preventDefault();
      setInstallPromptEvent(ev);
    }
    window.addEventListener("beforeinstallprompt", capturarInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", capturarInstallPrompt);
  }, []);

  useEffect(() => {
    if (!prefs.lembretesAtivos) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const verificarLembretes = async () => {
      const agora = new Date();
      const horaAtual = `${pad2(agora.getHours())}:${pad2(agora.getMinutes())}`;
      const hojeStr = toDateStr(agora);
      const dosesHoje = getDosesParaDia(hojeStr, protocolo);
      if (!dosesHoje.length) return;

      const agrupado = { manha: [], noite: [] };
      for (const dose of dosesHoje) {
        agrupado[inferirPeriodo(dose.horario)].push(dose);
      }

      for (const periodo of ["manha", "noite"]) {
        if (!agrupado[periodo].length) continue;
        if (prefs.horariosLembrete[periodo] !== horaAtual) continue;

        const token = `${hojeStr}-${periodo}-${horaAtual}`;
        const ultimoToken = await carregarStorage(CHAVE_ULTIMO_LEMBRETE);
        if (ultimoToken === token) continue;

        new Notification(
          periodo === "manha" ? "Lembrete da manha" : "Lembrete da noite",
          {
            body: `Voce tem ${agrupado[periodo].length} dose(s) para marcar agora.`,
          }
        );
        await salvarStorage(CHAVE_ULTIMO_LEMBRETE, token);
      }
    };

    verificarLembretes();
    const timer = setInterval(verificarLembretes, 30000);
    return () => clearInterval(timer);
  }, [prefs.lembretesAtivos, prefs.horariosLembrete, protocolo]);

  useEffect(() => {
    if (!mensagem) return undefined;
    const timer = setTimeout(() => setMensagem(""), 3500);
    return () => clearTimeout(timer);
  }, [mensagem]);

  useEffect(() => {
    if (carregando || !supabaseConfigurado || !sessao?.user?.id || !nuvemPronta) return undefined;
    const timer = setTimeout(() => {
      void salvarEstadoNaNuvem();
    }, 1200);
    return () => clearTimeout(timer);
  }, [
    carregando,
    marcadas,
    migracoes,
    nuvemPronta,
    prefs,
    protocolo,
    salvarEstadoNaNuvem,
    sessao,
    supabaseConfigurado,
  ]);

  function isMarcada(doseId, data = dataHoje) {
    return !!marcadas[`${data}-${doseId}`];
  }

  function isFuturo(data) {
    return data > dataHoje;
  }

  function toggle(doseId, data = dataHoje) {
    if (data > dataHoje) return;
    const chave = `${data}-${doseId}`;
    setMarcadas((prev) => {
      const anterior = !!prev[chave];
      const proximo = !anterior;
      setUltimaAcao({ chave, anterior, proximo, data, doseId });
      return { ...prev, [chave]: proximo };
    });
  }

  function desfazerUltimaAcao() {
    if (!ultimaAcao) return;
    setMarcadas((prev) => ({ ...prev, [ultimaAcao.chave]: ultimaAcao.anterior }));
    setMensagem("Ultima marcacao desfeita.");
    setUltimaAcao(null);
  }

  function atualizarDose(id, patch) {
    setProtocolo((prev) => prev.map((dose) => (dose.id === id ? { ...dose, ...patch } : dose)));
  }

  function alternarDiaDose(id, dia) {
    setProtocolo((prev) =>
      prev.map((dose) => {
        if (dose.id !== id) return dose;
        const existe = dose.diasSemana.includes(dia);
        return {
          ...dose,
          diasSemana: existe ? dose.diasSemana.filter((d) => d !== dia) : [...dose.diasSemana, dia],
        };
      })
    );
  }

  function adicionarDose() {
    setProtocolo((prev) => {
      const [cor, corFundo, corBorda] = gerarCor(prev.length);
      return [
        ...prev,
        {
          id: `custom-${Date.now()}`,
          nome: "Novo peptideo",
          dose: "100mcg",
          horario: "Manha",
          emoji: "💊",
          cor,
          corFundo,
          corBorda,
          diasSemana: ["Seg", "Qua", "Sex"],
          agendaTipo: "semanal",
          intervaloDias: null,
          descricao: "Ajuste conforme orientacao medica.",
          reconstituicao: "",
          unidades: null,
          dataInicio: "",
          dataFim: "",
        },
      ];
    });
    setMensagem("Novo item adicionado ao protocolo.");
  }

  function removerDose(id) {
    setProtocolo((prev) => prev.filter((dose) => dose.id !== id));
    setMarcadas((prev) => {
      const copia = { ...prev };
      for (const chave of Object.keys(copia)) {
        if (chave.endsWith(`-${id}`)) delete copia[chave];
      }
      return copia;
    });
    setMensagem("Item removido do protocolo.");
  }

  async function ativarPermissaoLembrete() {
    if (!("Notification" in window)) {
      setMensagem("Este dispositivo nao suporta notificacoes.");
      return;
    }
    const permissao = await Notification.requestPermission();
    if (permissao === "granted") {
      setPrefs((prev) => ({ ...prev, lembretesAtivos: true }));
      setMensagem("Lembretes ativados.");
      return;
    }
    setMensagem("Permissao de notificacao nao concedida.");
  }

  async function instalarApp() {
    if (!installPromptEvent) {
      setMensagem("Instalacao indisponivel neste navegador.");
      return;
    }
    await installPromptEvent.prompt();
    setInstallPromptEvent(null);
  }

  async function cadastrarContaNuvem() {
    if (!supabaseConfigurado || !supabase) {
      setMensagem("Supabase ainda nao configurado neste ambiente.");
      return;
    }
    if (!authEmail.trim() || !authSenha) {
      setMensagem("Preencha email e senha para criar a conta.");
      return;
    }

    setSincronizandoNuvem(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authSenha,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      setAuthSenha("");
      if (data.session) {
        setMensagem("Conta criada e conectada. Sincronizando seus dados...");
        setSyncStatus("Conta criada. Carregando nuvem...");
      } else {
        setMensagem("Conta criada. Verifique seu email para confirmar o acesso.");
        setSyncStatus("Conta criada. Aguardando confirmacao por email.");
      }
    } catch (error) {
      console.error("Falha ao cadastrar conta no Supabase", error);
      setMensagem(error.message || "Nao foi possivel criar a conta.");
    } finally {
      setSincronizandoNuvem(false);
    }
  }

  async function entrarContaNuvem() {
    if (!supabaseConfigurado || !supabase) {
      setMensagem("Supabase ainda nao configurado neste ambiente.");
      return;
    }
    if (!authEmail.trim() || !authSenha) {
      setMensagem("Preencha email e senha para entrar.");
      return;
    }

    setSincronizandoNuvem(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authSenha,
      });

      if (error) throw error;

      setAuthSenha("");
      setMensagem("Conta conectada. Carregando sua nuvem...");
      setSyncStatus("Conta conectada. Carregando nuvem...");
    } catch (error) {
      console.error("Falha ao entrar no Supabase", error);
      setMensagem(error.message || "Nao foi possivel entrar na conta.");
    } finally {
      setSincronizandoNuvem(false);
    }
  }

  async function enviarRecuperacaoSenha() {
    if (!supabaseConfigurado || !supabase) {
      setMensagem("Supabase ainda nao configurado neste ambiente.");
      return;
    }
    if (!authEmail.trim()) {
      setMensagem("Informe o email para recuperar a senha.");
      return;
    }

    setSincronizandoNuvem(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      setMensagem("Email de recuperacao enviado. Abra o link mais recente da sua caixa de entrada.");
      setSyncStatus("Email de recuperacao enviado.");
    } catch (error) {
      console.error("Falha ao enviar email de recuperacao", error);
      setMensagem(error.message || "Nao foi possivel enviar o email de recuperacao.");
    } finally {
      setSincronizandoNuvem(false);
    }
  }

  async function redefinirSenha() {
    if (!supabaseConfigurado || !supabase) {
      setMensagem("Supabase ainda nao configurado neste ambiente.");
      return;
    }
    if (!novaSenha || !confirmacaoSenha) {
      setMensagem("Preencha a nova senha e a confirmacao.");
      return;
    }
    if (novaSenha !== confirmacaoSenha) {
      setMensagem("A confirmacao da senha nao confere.");
      return;
    }
    if (novaSenha.length < 6) {
      setMensagem("Use pelo menos 6 caracteres na nova senha.");
      return;
    }

    setSincronizandoNuvem(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;

      setNovaSenha("");
      setConfirmacaoSenha("");
      setModoRecuperacaoSenha(false);
      setMensagem("Senha atualizada com sucesso. Agora voce pode entrar normalmente.");
      setSyncStatus("Senha redefinida com sucesso.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error("Falha ao redefinir senha", error);
      setMensagem(error.message || "Nao foi possivel redefinir a senha.");
    } finally {
      setSincronizandoNuvem(false);
    }
  }

  async function sairContaNuvem() {
    if (!supabaseConfigurado || !supabase) return;

    setSincronizandoNuvem(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setMensagem("Sessao encerrada. Seus dados locais continuam salvos neste navegador.");
    } catch (error) {
      console.error("Falha ao sair do Supabase", error);
      setMensagem(error.message || "Nao foi possivel encerrar a sessao.");
    } finally {
      setSincronizandoNuvem(false);
    }
  }

  async function sincronizarAgora() {
    if (!sessao?.user?.id) {
      setMensagem("Entre na conta para sincronizar com a nuvem.");
      return;
    }

    const ok = await salvarEstadoNaNuvem();
    if (!ok) return;

    await carregarEstadoDaNuvem(sessao.user.id);
    setMensagem("Dados sincronizados com a nuvem.");
  }

  async function baixarDaNuvemAgora() {
    if (!sessao?.user?.id) {
      setMensagem("Entre na conta para carregar os dados remotos.");
      return;
    }

    const ok = await carregarEstadoDaNuvem(sessao.user.id);
    if (ok) setMensagem("Dados remotos carregados.");
  }

  function abrirSeletorBackup() {
    inputBackupRef.current?.click();
  }

  async function importarBackupJSON(event) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    setImportandoBackup(true);
    try {
      const bruto = JSON.parse(await arquivo.text());
      const estado = normalizarEstadoNuvem({
        marcadas: bruto?.marcadas,
        protocolo: bruto?.protocolo,
        preferencias: bruto?.preferencias || bruto?.prefs,
        migracoes: bruto?.migracoes,
      });

      setMarcadas(estado.marcadas);
      setProtocolo(estado.protocolo);
      setPrefs(estado.prefs);
      setMigracoes(estado.migracoes);
      setUltimaAcao(null);
      setNomeArquivoImportado(arquivo.name);

      if (sessao?.user?.id) {
        const payloadNuvem = montarPayloadNuvem({
          marcadas: estado.marcadas,
          protocolo: estado.protocolo,
          prefs: estado.prefs,
          migracoes: estado.migracoes,
        });

        const ok = await salvarEstadoNaNuvem(payloadNuvem);
        if (ok) {
          await carregarEstadoDaNuvem(sessao.user.id);
          setMensagem(`Backup ${arquivo.name} importado e enviado para o Supabase.`);
        } else {
          setMensagem(`Backup ${arquivo.name} importado localmente, mas a sincronizacao falhou.`);
        }
      } else {
        setMensagem(`Backup ${arquivo.name} importado localmente. Entre na conta para enviar ao Supabase.`);
      }
    } catch (error) {
      console.error("Falha ao importar backup JSON", error);
      setMensagem("Nao foi possivel ler esse backup. Verifique se o arquivo JSON esta valido.");
    } finally {
      setImportandoBackup(false);
      event.target.value = "";
    }
  }

  function exportarJSON() {
    const payload = {
      exportadoEm: new Date().toISOString(),
      protocolo,
      marcadas,
      preferencias: prefs,
      migracoes,
      diarioClinico: HISTORICO_CLINICO,
      fasesClinicas: FASES_DIARIO,
      notasClinicas: NOTAS_CLINICAS,
    };
    downloadArquivo(`peptide-backup-${dataHoje}.json`, JSON.stringify(payload, null, 2), "application/json");
    setMensagem("Backup JSON exportado.");
  }

  function exportarCSV() {
    const linhas = ["data,dose_id,dose_nome,marcada"];
    const datas = Object.keys(marcadas).sort();
    for (const chave of datas) {
      const [y, m, d, ...resto] = chave.split("-");
      const data = `${y}-${m}-${d}`;
      const doseId = resto.join("-");
      const dose = protocolo.find((item) => item.id === doseId);
      linhas.push(`${data},${doseId},"${dose?.nome || "Desconhecida"}",${marcadas[chave] ? "sim" : "nao"}`);
    }
    downloadArquivo(`peptide-marcacoes-${dataHoje}.csv`, linhas.join("\n"), "text/csv;charset=utf-8");
    setMensagem("CSV exportado.");
  }

  async function exportarPDF() {
    try {
      setMensagem("Preparando PDF...");
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const historicoAplicacoes = montarHistoricoAplicacoes(marcadas, protocolo);
      const resumoPorPeptideo = montarResumoPorPeptideo(historicoAplicacoes);
      const resumoClinicoManual = montarResumoClinico(HISTORICO_CLINICO);
      const fasesClinicasManual = montarFasesClinicas(HISTORICO_CLINICO);
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const largura = doc.internal.pageSize.getWidth();
      const altura = doc.internal.pageSize.getHeight();
      const margemX = 42;
      let cursorY = 145;

      function adicionarTituloSecao(titulo) {
        if (cursorY > altura - 120) {
          doc.addPage();
          cursorY = 54;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(titulo, margemX, cursorY);
        cursorY += 16;
      }

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, largura, 110, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text("Relatorio de Aplicacoes", margemX, 46);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Historico clinico manual, protocolo atual e datas registradas.", margemX, 68);
      doc.text(`Gerado em ${formatarDataHoraAtual()}`, margemX, 86);

      adicionarTituloSecao("Resumo Executivo");
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margemX, right: margemX },
        head: [["Indicador", "Valor"]],
        body: [
          ["Aplicacoes registradas", String(historicoAplicacoes.length)],
          ["Peptideos no protocolo", String(protocolo.length)],
          ["Adesao ultimos 7 dias", `${historico7d.pct}% (${historico7d.feitas}/${historico7d.total})`],
          ["Adesao no mes atual", `${historicoMes.pct}% (${historicoMes.feitas}/${historicoMes.total})`],
          ["Doses concluidas hoje", `${marcadasHoje} de ${dosesHoje.length}`],
        ],
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 7,
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 190 },
        },
      });
      cursorY = doc.lastAutoTable.finalY + 24;

      adicionarTituloSecao("Diario Clinico Consolidado");
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margemX, right: margemX },
        head: [["Indicador", "Valor"]],
        body: [
          ["Aplicacoes do diario manual", String(resumoClinicoManual.total)],
          ["Tirzepatida no diario", String(resumoClinicoManual.tirzepatida)],
          ["Retatrutida no diario", String(resumoClinicoManual.retatrutida)],
          [
            "Primeiro registro",
            resumoClinicoManual.primeiro
              ? `${formatarDataCurta(resumoClinicoManual.primeiro.data)} - ${resumoClinicoManual.primeiro.peso}`
              : "-",
          ],
          [
            "Ultimo registro",
            resumoClinicoManual.ultimo
              ? `${formatarDataCurta(resumoClinicoManual.ultimo.data)} - ${resumoClinicoManual.ultimo.peso}`
              : "-",
          ],
          ["Variacao observada no diario", resumoClinicoManual.variacaoRegistradaTexto],
        ],
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 7,
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [15, 118, 110],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 190 },
        },
      });
      cursorY = doc.lastAutoTable.finalY + 24;

      adicionarTituloSecao("Fases do Diario");
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margemX, right: margemX },
        head: [["Fase", "Periodo", "Contexto", "Aplicacoes / resumo"]],
        body: fasesClinicasManual.map((fase) => [
          fase.titulo,
          fase.periodoExibicao,
          fase.tipo === "washout" ? fase.medicacao : `${fase.subtitulo} - ${fase.medicacao}`,
          fase.tipo === "washout" ? fase.resumo : `${fase.totalAplicacoes} aplicacoes. ${fase.resumo}`,
        ]),
        theme: "striped",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 6,
          textColor: [30, 41, 59],
          valign: "top",
        },
        headStyles: {
          fillColor: [100, 116, 139],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 126 },
          1: { cellWidth: 88 },
          2: { cellWidth: 148 },
          3: { cellWidth: 122 },
        },
      });
      cursorY = doc.lastAutoTable.finalY + 24;

      adicionarTituloSecao("Historico Clinico Manual");
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margemX, right: margemX },
        head: [["#", "Data", "Composto", "Dose", "Medicacao", "Peso", "Obs."]],
        body: HISTORICO_CLINICO.map((item) => [
          String(item.aplicacao),
          formatarDataCurta(item.data),
          item.composto,
          item.dose,
          item.medicacao,
          item.peso,
          [item.variacao, item.observacoes].filter(Boolean).join(" | ") || "-",
        ]),
        theme: "striped",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 5,
          textColor: [30, 41, 59],
          valign: "top",
        },
        headStyles: {
          fillColor: [194, 65, 12],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 24, halign: "center" },
          1: { cellWidth: 54 },
          2: { cellWidth: 70 },
          3: { cellWidth: 44 },
          4: { cellWidth: 108 },
          5: { cellWidth: 56 },
          6: { cellWidth: 144 },
        },
      });
      cursorY = doc.lastAutoTable.finalY + 24;

      adicionarTituloSecao("Notas Estrategicas Informadas");
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margemX, right: margemX },
        head: [["Bloco", "Conteudo"]],
        body: [
          [NOTAS_CLINICAS.situacaoTitulo, NOTAS_CLINICAS.situacao.join(" ")],
          ["Linha do tempo", NOTAS_CLINICAS.linhaTempo.join(" ")],
          ["Fase atual", NOTAS_CLINICAS.faseAtual],
          ["Objetivos", NOTAS_CLINICAS.objetivos.join(" ")],
          ["Evolucao global", NOTAS_CLINICAS.evolucaoGlobal.join(" ")],
        ],
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 6,
          textColor: [30, 41, 59],
          valign: "top",
        },
        headStyles: {
          fillColor: [29, 78, 216],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 126 },
          1: { cellWidth: 350 },
        },
      });
      cursorY = doc.lastAutoTable.finalY + 24;

      adicionarTituloSecao("Protocolo Atual");
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margemX, right: margemX },
        head: [["Peptideo", "Dose", "Horario", "Agenda", "Periodo", "Observacoes"]],
        body: protocolo.map((dose) => [
          dose.nome,
          dose.dose,
          dose.horario,
          formatarAgendaDose(dose),
          formatarPeriodoDose(dose),
          dose.descricao,
        ]),
        theme: "striped",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 6,
          textColor: [30, 41, 59],
          valign: "top",
        },
        headStyles: {
          fillColor: [29, 78, 216],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 88 },
          1: { cellWidth: 50 },
          2: { cellWidth: 78 },
          3: { cellWidth: 88 },
          4: { cellWidth: 88 },
          5: { cellWidth: 125 },
        },
      });
      cursorY = doc.lastAutoTable.finalY + 24;

      adicionarTituloSecao("Totais Por Peptideo");
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margemX, right: margemX },
        head: [["Peptideo", "Aplicacoes registradas"]],
        body: resumoPorPeptideo.length
          ? resumoPorPeptideo.map((item) => [item.nome, String(item.total)])
          : [["Nenhum registro", "0"]],
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 7,
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [21, 128, 61],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          1: { halign: "center", cellWidth: 140 },
        },
      });
      cursorY = doc.lastAutoTable.finalY + 24;

      adicionarTituloSecao("Historico Completo de Aplicacoes");
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margemX, right: margemX },
        head: [["Data", "Peptideo", "Dose", "Horario", "Periodo", "Status"]],
        body: historicoAplicacoes.length
          ? historicoAplicacoes.map((item) => [
              formatarDataCurta(item.data),
              item.nome,
              item.dose,
              item.horario,
              item.periodo,
              "Aplicado",
            ])
          : [["-", "Nenhuma aplicacao registrada", "-", "-", "-", "-"]],
        theme: "striped",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 6,
          textColor: [30, 41, 59],
          valign: "top",
        },
        headStyles: {
          fillColor: [234, 88, 12],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 62 },
          1: { cellWidth: 88 },
          2: { cellWidth: 48 },
          3: { cellWidth: 74 },
          4: { cellWidth: 160 },
          5: { cellWidth: 56, halign: "center" },
        },
      });

      const totalPaginas = doc.getNumberOfPages();
      for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
        doc.setPage(pagina);
        doc.setDrawColor(226, 232, 240);
        doc.line(margemX, altura - 36, largura - margemX, altura - 36);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("Peptides Calendar · Relatorio PDF", margemX, altura - 20);
        doc.text(`Pagina ${pagina} de ${totalPaginas}`, largura - margemX, altura - 20, { align: "right" });
      }

      doc.save(`relatorio-aplicacoes-${dataHoje}.pdf`);
      setMensagem("PDF exportado.");
    } catch (error) {
      console.error("Falha ao exportar PDF", error);
      setMensagem("Falha ao gerar o PDF. Recarregue a pagina e tente novamente.");
    }
  }

  const dosesHoje = useMemo(() => getDosesParaDia(dataHoje, protocolo), [dataHoje, protocolo]);
  const marcadasHoje = useMemo(() => dosesHoje.filter((d) => isMarcada(d.id)).length, [dosesHoje, marcadas]);
  const faltamHoje = Math.max(dosesHoje.length - marcadasHoje, 0);
  const progresso = dosesHoje.length ? Math.round((marcadasHoje / dosesHoje.length) * 100) : 0;
  const tudoFeito = dosesHoje.length > 0 && marcadasHoje === dosesHoje.length;

  const semanaDeHoje = inicioSemana(dataHoje);
  const diasSemana = semana7(semanaAtual);
  const isPastSemana = semanaAtual < semanaDeHoje;
  const isFuturaSemanaMax = addDays(semanaAtual, 7) > addDays(semanaDeHoje, 84);

  const historico7d = useMemo(
    () => montarMetricas(addDays(dataHoje, -6), dataHoje, protocolo, marcadas, dataHoje),
    [dataHoje, protocolo, marcadas]
  );
  const inicioMes = useMemo(() => {
    const d = parseDate(dataHoje);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
  }, [dataHoje]);
  const historicoMes = useMemo(
    () => montarMetricas(inicioMes, dataHoje, protocolo, marcadas, dataHoje),
    [inicioMes, dataHoje, protocolo, marcadas]
  );
  const resumoClinico = useMemo(() => montarResumoClinico(HISTORICO_CLINICO), []);
  const fasesClinicas = useMemo(() => montarFasesClinicas(HISTORICO_CLINICO), []);

  if (carregando) {
    return (
      <div
        style={{
          fontFamily: "'Segoe UI', Arial, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: tema.fundo,
          color: tema.textoSuave,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        background: tema.fundo,
        minHeight: "100vh",
        color: tema.texto,
        fontSize: prefs.fonteGrande ? 18 : 16,
      }}
    >
      <style>
        {`
          button:focus-visible, input:focus-visible, textarea:focus-visible {
            outline: 3px solid ${tema.destaque};
            outline-offset: 2px;
          }
        `}
      </style>

      <div style={{ background: tema.cabecalho, padding: "20px 20px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 2 }}>
                {prefs.nome} · {formatarData(dataHoje)}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#FFF" }}>Minhas Doses</div>
              <div style={{ fontSize: 13, color: "#CBD5E1", marginTop: 4 }}>
                {faltamHoje === 0 ? "Nada pendente para hoje." : `Faltam ${faltamHoje} dose(s) para hoje.`}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: "50%",
                  background: `conic-gradient(${tudoFeito ? tema.sucesso : tema.destaque} ${progresso * 3.6}deg, #1E293B 0deg)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label={`Progresso de hoje: ${progresso}%`}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: tema.cabecalho,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFF",
                    fontWeight: 800,
                  }}
                >
                  {tudoFeito ? "✓" : `${progresso}%`}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ABAS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setAba(i)}
                aria-pressed={aba === i}
                style={{
                  background: "transparent",
                  color: aba === i ? "#FFF" : "#94A3B8",
                  border: "none",
                  borderBottom: `3px solid ${aba === i ? tema.destaque : "transparent"}`,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: aba === i ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 30px" }}>
        {mensagem && (
          <div
            role="status"
            style={{
              marginBottom: 12,
              background: "#DBEAFE",
              border: "1px solid #93C5FD",
              color: "#1E3A8A",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
            }}
          >
            {mensagem}
          </div>
        )}

        <div
          style={{
            background: tema.superficie,
            border: `1px solid ${tema.borda}`,
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              onClick={desfazerUltimaAcao}
              disabled={!ultimaAcao}
              style={{
                border: `1px solid ${tema.borda}`,
                background: !ultimaAcao ? "#F8FAFC" : "#FFFFFF",
                color: !ultimaAcao ? "#94A3B8" : tema.texto,
                borderRadius: 10,
                padding: "8px 12px",
                cursor: !ultimaAcao ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              Desfazer ultima marcacao
            </button>
            <button
              onClick={exportarPDF}
              style={{
                border: `1px solid ${tema.borda}`,
                background: "#FFFFFF",
                color: tema.texto,
                borderRadius: 10,
                padding: "8px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Exportar PDF
            </button>
            <button
              onClick={exportarJSON}
              style={{
                border: `1px solid ${tema.borda}`,
                background: "#FFFFFF",
                color: tema.texto,
                borderRadius: 10,
                padding: "8px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Exportar JSON
            </button>
            <button
              onClick={exportarCSV}
              style={{
                border: `1px solid ${tema.borda}`,
                background: "#FFFFFF",
                color: tema.texto,
                borderRadius: 10,
                padding: "8px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Exportar CSV
            </button>
            {installPromptEvent && (
              <button
                onClick={instalarApp}
                style={{
                  border: "1px solid #BFDBFE",
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  borderRadius: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Instalar app
              </button>
            )}
          </div>
        </div>

        {aba === 0 && (
          <div>
            <div
              style={{
                background: tudoFeito ? "#F0FDF4" : tema.superficie,
                border: `1px solid ${tudoFeito ? "#86EFAC" : tema.borda}`,
                borderRadius: 14,
                padding: "14px 18px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: tema.textoSuave }}>
                  {DIAS_SEMANA[parseDate(dataHoje).getDay()]}, {formatarData(dataHoje)}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
                  {tudoFeito
                    ? "Dia completo!"
                    : dosesHoje.length === 0
                    ? "Hoje e dia de descanso"
                    : `${marcadasHoje} de ${dosesHoje.length} doses feitas`}
                </div>
              </div>
              {tudoFeito && <div style={{ fontSize: 32 }}>🎉</div>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {dosesHoje.map((dose) => {
                const feita = isMarcada(dose.id);
                return (
                  <button
                    key={dose.id}
                    onClick={() => toggle(dose.id)}
                    aria-pressed={feita}
                    aria-label={`${dose.nome} ${dose.dose}, ${feita ? "marcada" : "pendente"}`}
                    style={{
                      background: feita ? dose.corFundo : tema.superficie,
                      border: `2px solid ${feita ? dose.cor : tema.borda}`,
                      borderRadius: 16,
                      padding: "16px",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: feita ? dose.cor : "#F1F5F9",
                        border: `2px solid ${feita ? dose.cor : tema.borda}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        color: feita ? "#FFF" : "#475569",
                      }}
                      aria-hidden="true"
                    >
                      {feita ? "✓" : dose.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                        <strong
                          style={{
                            fontSize: 18,
                            color: feita ? dose.cor : tema.texto,
                            textDecoration: feita ? "line-through" : "none",
                          }}
                        >
                          {dose.nome}
                        </strong>
                        <span
                          style={{
                            background: feita ? dose.cor : "#F1F5F9",
                            color: feita ? "#FFF" : "#475569",
                            borderRadius: 20,
                            padding: "4px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {dose.dose}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: tema.textoSuave, marginTop: 4 }}>{dose.horario}</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{dose.descricao}</div>
                      <div style={{ marginTop: 6, fontSize: 12, color: feita ? tema.sucesso : "#B45309", fontWeight: 600 }}>
                        {feita ? "Status: Feito" : "Status: Pendente"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {aba === 1 && (
          <div>
            <div
              style={{
                background: tema.superficie,
                borderRadius: 14,
                border: `1px solid ${tema.borda}`,
                padding: "12px 16px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <button
                onClick={() => {
                  const nova = addDays(semanaAtual, -7);
                  setSemanaAtual(nova);
                  setDataSelecionada(nova);
                }}
                aria-label="Semana anterior"
                style={{
                  background: "#F1F5F9",
                  border: "1px solid #CBD5E1",
                  borderRadius: 10,
                  width: 38,
                  height: 38,
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ‹
              </button>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{formatarSemana(semanaAtual)}</div>
                {semanaAtual === semanaDeHoje && <div style={{ fontSize: 12, color: tema.destaque }}>semana atual</div>}
                {isPastSemana && <div style={{ fontSize: 12, color: tema.textoSuave }}>semana passada</div>}
                {semanaAtual > semanaDeHoje && <div style={{ fontSize: 12, color: "#B45309" }}>semana futura</div>}
              </div>

              <button
                onClick={() => {
                  if (isFuturaSemanaMax) return;
                  const nova = addDays(semanaAtual, 7);
                  setSemanaAtual(nova);
                  setDataSelecionada(nova);
                }}
                aria-label="Proxima semana"
                style={{
                  background: isFuturaSemanaMax ? "#F8FAFC" : "#F1F5F9",
                  border: "1px solid #CBD5E1",
                  borderRadius: 10,
                  width: 38,
                  height: 38,
                  fontSize: 18,
                  cursor: isFuturaSemanaMax ? "not-allowed" : "pointer",
                  color: isFuturaSemanaMax ? "#94A3B8" : tema.texto,
                }}
              >
                ›
              </button>
            </div>

            {semanaAtual !== semanaDeHoje && (
              <button
                onClick={() => {
                  setSemanaAtual(semanaDeHoje);
                  setDataSelecionada(dataHoje);
                }}
                style={{
                  width: "100%",
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: 10,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1D4ED8",
                  marginBottom: 14,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Voltar para a semana de hoje
              </button>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 20 }}>
              {diasSemana.map((data) => {
                const doses = getDosesParaDia(data, protocolo);
                const futuro = isFuturo(data);
                const feitas = futuro ? 0 : doses.filter((d) => isMarcada(d.id, data)).length;
                const total = doses.length;
                const pct = total > 0 && !futuro ? feitas / total : 0;
                const isHoje = data === dataHoje;
                const isSel = data === dataSelecionada;
                const d = parseDate(data);

                return (
                  <button
                    key={data}
                    onClick={() => setDataSelecionada(data)}
                    aria-label={`${DIAS_SEMANA[d.getDay()]} ${d.getDate()}, ${feitas} de ${total} doses feitas`}
                    style={{
                      background: isSel ? "#1E293B" : isHoje ? "#EFF6FF" : tema.superficie,
                      border: `2px solid ${isSel ? tema.destaque : isHoje ? "#93C5FD" : tema.borda}`,
                      borderRadius: 12,
                      padding: "10px 4px",
                      cursor: "pointer",
                      textAlign: "center",
                      fontFamily: "inherit",
                      opacity: futuro ? 0.6 : 1,
                    }}
                  >
                    <div style={{ fontSize: 10, color: isSel ? "#CBD5E1" : "#94A3B8", marginBottom: 2 }}>
                      {DIAS_SEMANA[d.getDay()]}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: isSel ? "#FFF" : tema.texto }}>{d.getDate()}</div>
                    <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: "#E2E8F0", overflow: "hidden" }}>
                      {!futuro && total > 0 && (
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 2,
                            background: pct === 1 ? tema.sucesso : pct > 0 ? "#F59E0B" : "#CBD5E1",
                            width: `${pct * 100}%`,
                          }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {(() => {
              const doses = getDosesParaDia(dataSelecionada, protocolo);
              const d = parseDate(dataSelecionada);
              const futuro = isFuturo(dataSelecionada);
              return (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: tema.textoSuave, marginBottom: 12 }}>
                    {DIAS_SEMANA[d.getDay()]}, {formatarData(dataSelecionada)}
                    {dataSelecionada === dataHoje ? " · hoje" : ""}
                  </div>

                  {futuro && (
                    <div
                      style={{
                        background: "#FFFBEB",
                        border: "1px solid #FDE68A",
                        borderRadius: 12,
                        padding: "12px 16px",
                        marginBottom: 14,
                        fontSize: 13,
                        color: "#92400E",
                      }}
                    >
                      Dia futuro: voce pode consultar, mas so marca quando o dia chegar.
                    </div>
                  )}

                  {doses.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 24, color: "#94A3B8" }}>Dia de descanso</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {doses.map((dose) => {
                        const feita = !futuro && isMarcada(dose.id, dataSelecionada);
                        return (
                          <button
                            key={dose.id}
                            onClick={() => toggle(dose.id, dataSelecionada)}
                            disabled={futuro}
                            aria-pressed={feita}
                            aria-label={`${dose.nome} ${dose.dose}, ${feita ? "feito" : "pendente"}`}
                            style={{
                              background: feita ? dose.corFundo : tema.superficie,
                              border: `2px solid ${feita ? dose.cor : tema.borda}`,
                              borderRadius: 14,
                              padding: "12px 14px",
                              cursor: futuro ? "default" : "pointer",
                              textAlign: "left",
                              width: "100%",
                              fontFamily: "inherit",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              opacity: futuro ? 0.7 : 1,
                            }}
                          >
                            <div style={{ fontSize: 20, width: 30, textAlign: "center" }}>{feita ? "✓" : dose.emoji}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 15, fontWeight: 700 }}>{dose.nome}</div>
                              <div style={{ fontSize: 12, color: "#64748B" }}>{dose.horario}</div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{feita ? "Feito" : futuro ? "Futuro" : "Pendente"}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {aba === 2 && (
          <div>
            <div
              style={{
                background: tema.superficie,
                border: `1px solid ${tema.borda}`,
                borderRadius: 14,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 13, color: tema.textoSuave, marginBottom: 12 }}>
                Guia do protocolo: aqui ficam apenas os dados do protocolo atual, com edicao, datas e agenda de cada item.
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Protocolo personalizado</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setEditandoProtocolo((v) => !v)}
                    style={{
                      border: "1px solid #CBD5E1",
                      background: "#FFFFFF",
                      borderRadius: 10,
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {editandoProtocolo ? "Concluir edicao" : "Editar protocolo"}
                  </button>
                  {editandoProtocolo && (
                    <button
                      onClick={adicionarDose}
                      style={{
                        border: "1px solid #BBF7D0",
                        background: "#F0FDF4",
                        color: "#166534",
                        borderRadius: 10,
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Adicionar item
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {protocolo.map((dose) => (
                  <div
                    key={dose.id}
                    style={{
                      background: "#FFFFFF",
                      border: `1px solid ${dose.corBorda || tema.borda}`,
                      borderLeft: `5px solid ${dose.cor || tema.destaque}`,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    {!editandoProtocolo ? (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <strong style={{ fontSize: 16 }}>{dose.emoji} {dose.nome}</strong>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{dose.dose}</span>
                        </div>
                        <div style={{ fontSize: 13, color: tema.textoSuave, marginTop: 4 }}>{dose.horario}</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>{dose.descricao}</div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>
                          Agenda: {formatarAgendaDose(dose)}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                          Periodo: {formatarPeriodoDose(dose)}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
                        <label style={{ fontSize: 12 }}>
                          Nome
                          <input
                            value={dose.nome}
                            onChange={(e) => atualizarDose(dose.id, { nome: e.target.value })}
                            style={{ width: "100%", marginTop: 2 }}
                          />
                        </label>
                        <label style={{ fontSize: 12 }}>
                          Dose
                          <input
                            value={dose.dose}
                            onChange={(e) => atualizarDose(dose.id, { dose: e.target.value })}
                            style={{ width: "100%", marginTop: 2 }}
                          />
                        </label>
                        <label style={{ fontSize: 12 }}>
                          Horario
                          <input
                            value={dose.horario}
                            onChange={(e) => atualizarDose(dose.id, { horario: e.target.value })}
                            style={{ width: "100%", marginTop: 2 }}
                          />
                        </label>
                        <label style={{ fontSize: 12 }}>
                          Emoji
                          <input
                            value={dose.emoji}
                            onChange={(e) => atualizarDose(dose.id, { emoji: e.target.value })}
                            style={{ width: "100%", marginTop: 2 }}
                          />
                        </label>
                        <label style={{ fontSize: 12 }}>
                          Agenda
                          <select
                            value={dose.agendaTipo || "semanal"}
                            onChange={(e) =>
                              atualizarDose(dose.id, {
                                agendaTipo: e.target.value,
                                intervaloDias: e.target.value === "intervalo" ? dose.intervaloDias || 2 : null,
                              })
                            }
                            style={{ width: "100%", marginTop: 2 }}
                          >
                            <option value="semanal">Dias da semana</option>
                            <option value="intervalo">Intervalo em dias</option>
                          </select>
                        </label>
                        {(dose.agendaTipo || "semanal") === "intervalo" && (
                          <label style={{ fontSize: 12 }}>
                            Intervalo (dias)
                            <input
                              type="number"
                              min="1"
                              value={dose.intervaloDias || 2}
                              onChange={(e) =>
                                atualizarDose(dose.id, {
                                  intervaloDias: Math.max(Number(e.target.value || 1), 1),
                                })
                              }
                              style={{ width: "100%", marginTop: 2 }}
                            />
                          </label>
                        )}
                        <label style={{ fontSize: 12 }}>
                          Data de inicio
                          <input
                            type="date"
                            value={dose.dataInicio || ""}
                            onChange={(e) => atualizarDose(dose.id, { dataInicio: e.target.value })}
                            style={{ width: "100%", marginTop: 2 }}
                          />
                        </label>
                        <label style={{ fontSize: 12 }}>
                          Data de fim
                          <input
                            type="date"
                            value={dose.dataFim || ""}
                            onChange={(e) => atualizarDose(dose.id, { dataFim: e.target.value })}
                            style={{ width: "100%", marginTop: 2 }}
                          />
                        </label>
                        <label style={{ fontSize: 12, gridColumn: "1 / -1" }}>
                          Descricao
                          <textarea
                            value={dose.descricao}
                            onChange={(e) => atualizarDose(dose.id, { descricao: e.target.value })}
                            style={{ width: "100%", marginTop: 2, minHeight: 56 }}
                          />
                        </label>
                        {(dose.agendaTipo || "semanal") === "semanal" && (
                          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {DIAS_SEMANA.map((dia) => (
                              <label key={`${dose.id}-${dia}`} style={{ fontSize: 12, border: "1px solid #CBD5E1", borderRadius: 8, padding: "4px 8px" }}>
                                <input
                                  type="checkbox"
                                  checked={dose.diasSemana.includes(dia)}
                                  onChange={() => alternarDiaDose(dose.id, dia)}
                                />{" "}
                                {dia}
                              </label>
                            ))}
                          </div>
                        )}
                        <div style={{ gridColumn: "1 / -1", textAlign: "right" }}>
                          <button
                            onClick={() => removerDose(dose.id)}
                            style={{
                              border: "1px solid #FECACA",
                              background: "#FEF2F2",
                              color: "#B91C1C",
                              borderRadius: 10,
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            Remover item
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#FEF9C3", border: "1px solid #FDE68A", borderRadius: 12, padding: 14, fontSize: 13, color: tema.alerta }}>
              Lembrete: qualquer mudanca no protocolo deve ser validada com seu medico.
            </div>
          </div>
        )}

        {aba === 3 && (
          <div>
            <div
              style={{
                background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)",
                border: `1px solid ${tema.borda}`,
                borderRadius: 18,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Conta e sincronizacao</div>
                  <div style={{ fontSize: 13, color: tema.textoSuave }}>
                    Gerencie sua conta, acompanhe o status da nuvem e controle a sincronizacao entre dispositivos.
                  </div>
                </div>
                <div
                  style={{
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    background: sessao ? "#F0FDF4" : "#FFFFFF",
                    border: `1px solid ${sessao ? "#BBF7D0" : tema.borda}`,
                    color: sessao ? "#166534" : tema.textoSuave,
                  }}
                >
                  {sincronizandoNuvem ? "Sincronizando..." : sessao ? "Conta conectada" : "Modo local"}
                </div>
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${tema.borda}`,
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Conta e sincronizacao</div>
                <div style={{ fontSize: 12, color: tema.textoSuave, marginBottom: 12 }}>
                  O app sempre salva no navegador. Quando a conta esta ativa, ele tambem sincroniza com o Supabase.
                </div>

                {!supabaseConfigurado ? (
                  <div
                    style={{
                      background: "#FFFBEB",
                      border: "1px solid #FDE68A",
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 13,
                      color: "#92400E",
                    }}
                  >
                    Supabase nao configurado neste ambiente. Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
                    no `.env.local` ou nas variaveis do Netlify para ativar a sincronizacao.
                  </div>
                ) : modoRecuperacaoSenha ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                    <div style={{ gridColumn: "1 / -1", fontSize: 13, color: tema.textoSuave }}>
                      O link de recuperacao foi reconhecido. Defina abaixo a nova senha da sua conta.
                    </div>
                    <label style={{ fontSize: 12 }}>
                      Nova senha
                      <input
                        type="password"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Nova senha"
                        style={{ width: "100%", marginTop: 2 }}
                      />
                    </label>
                    <label style={{ fontSize: 12 }}>
                      Confirmar nova senha
                      <input
                        type="password"
                        value={confirmacaoSenha}
                        onChange={(e) => setConfirmacaoSenha(e.target.value)}
                        placeholder="Repita a nova senha"
                        style={{ width: "100%", marginTop: 2 }}
                      />
                    </label>
                    <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <button
                        onClick={redefinirSenha}
                        disabled={sincronizandoNuvem}
                        style={{
                          border: "1px solid #BBF7D0",
                          background: "#F0FDF4",
                          color: "#166534",
                          borderRadius: 10,
                          padding: "8px 12px",
                          cursor: sincronizandoNuvem ? "wait" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Salvar nova senha
                      </button>
                    </div>
                    <div style={{ gridColumn: "1 / -1", fontSize: 12, color: tema.textoSuave }}>
                      Status: {sincronizandoNuvem ? "Processando..." : syncStatus}
                    </div>
                  </div>
                ) : !sessao ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                    <label style={{ fontSize: 12 }}>
                      Email
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="voce@exemplo.com"
                        style={{ width: "100%", marginTop: 2 }}
                      />
                    </label>
                    <label style={{ fontSize: 12 }}>
                      Senha
                      <input
                        type="password"
                        value={authSenha}
                        onChange={(e) => setAuthSenha(e.target.value)}
                        placeholder="Sua senha"
                        style={{ width: "100%", marginTop: 2 }}
                      />
                    </label>
                    <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <button
                        onClick={cadastrarContaNuvem}
                        disabled={sincronizandoNuvem}
                        style={{
                          border: "1px solid #BFDBFE",
                          background: "#EFF6FF",
                          color: "#1D4ED8",
                          borderRadius: 10,
                          padding: "8px 12px",
                          cursor: sincronizandoNuvem ? "wait" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Criar conta
                      </button>
                      <button
                        onClick={entrarContaNuvem}
                        disabled={sincronizandoNuvem}
                        style={{
                          border: `1px solid ${tema.borda}`,
                          background: "#FFFFFF",
                          color: tema.texto,
                          borderRadius: 10,
                          padding: "8px 12px",
                          cursor: sincronizandoNuvem ? "wait" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Entrar
                      </button>
                      <button
                        onClick={enviarRecuperacaoSenha}
                        disabled={sincronizandoNuvem}
                        style={{
                          border: "1px solid #E2E8F0",
                          background: "#F8FAFC",
                          color: tema.texto,
                          borderRadius: 10,
                          padding: "8px 12px",
                          cursor: sincronizandoNuvem ? "wait" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div style={{ gridColumn: "1 / -1", fontSize: 12, color: tema.textoSuave }}>
                      Status: {sincronizandoNuvem ? "Processando..." : syncStatus}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 12 }}>
                      <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 11, color: tema.textoSuave }}>Conta</div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, wordBreak: "break-word" }}>{sessao.user.email}</div>
                      </div>
                      <div style={{ background: "#F0FDF4", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 11, color: "#166534" }}>Status</div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: "#166534" }}>
                          {sincronizandoNuvem ? "Sincronizando..." : "Sincronizado"}
                        </div>
                      </div>
                      <div style={{ background: "#EFF6FF", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 11, color: "#1D4ED8" }}>Ultima sync</div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: "#1D4ED8" }}>
                          {ultimaSyncEm ? formatarDataHora(ultimaSyncEm) : "Pendente"}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: tema.textoSuave, marginBottom: 12 }}>{syncStatus}</div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <button
                        onClick={sincronizarAgora}
                        disabled={sincronizandoNuvem}
                        style={{
                          border: "1px solid #BBF7D0",
                          background: "#F0FDF4",
                          color: "#166534",
                          borderRadius: 10,
                          padding: "8px 12px",
                          cursor: sincronizandoNuvem ? "wait" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Sincronizar agora
                      </button>
                      <button
                        onClick={baixarDaNuvemAgora}
                        disabled={sincronizandoNuvem}
                        style={{
                          border: "1px solid #BFDBFE",
                          background: "#EFF6FF",
                          color: "#1D4ED8",
                          borderRadius: 10,
                          padding: "8px 12px",
                          cursor: sincronizandoNuvem ? "wait" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Recarregar da nuvem
                      </button>
                      <button
                        onClick={sairContaNuvem}
                        disabled={sincronizandoNuvem}
                        style={{
                          border: "1px solid #FECACA",
                          background: "#FEF2F2",
                          color: "#B91C1C",
                          borderRadius: 10,
                          padding: "8px 12px",
                          cursor: sincronizandoNuvem ? "wait" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                background: tema.superficie,
                border: `1px solid ${tema.borda}`,
                borderRadius: 14,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Acessibilidade e rotina</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={prefs.fonteGrande}
                    onChange={(e) => setPrefs((prev) => ({ ...prev, fonteGrande: e.target.checked }))}
                  />
                  Fonte maior
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={prefs.altoContraste}
                    onChange={(e) => setPrefs((prev) => ({ ...prev, altoContraste: e.target.checked }))}
                  />
                  Alto contraste
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={prefs.lembretesAtivos}
                    onChange={(e) => setPrefs((prev) => ({ ...prev, lembretesAtivos: e.target.checked }))}
                  />
                  Lembretes ativos
                </label>
                <button
                  onClick={ativarPermissaoLembrete}
                  style={{
                    border: "1px solid #BFDBFE",
                    background: "#EFF6FF",
                    color: "#1D4ED8",
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Permitir notificacoes
                </button>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                <label style={{ fontSize: 13 }}>
                  Lembrete manha
                  <input
                    type="time"
                    value={prefs.horariosLembrete.manha}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        horariosLembrete: { ...prev.horariosLembrete, manha: e.target.value },
                      }))
                    }
                    style={{ marginLeft: 8 }}
                  />
                </label>
                <label style={{ fontSize: 13 }}>
                  Lembrete noite
                  <input
                    type="time"
                    value={prefs.horariosLembrete.noite}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        horariosLembrete: { ...prev.horariosLembrete, noite: e.target.value },
                      }))
                    }
                    style={{ marginLeft: 8 }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {aba === 4 && (
          <div>
            <div
              style={{
                background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)",
                border: `1px solid ${tema.borda}`,
                borderRadius: 18,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Backup e restauracao</div>
                  <div style={{ fontSize: 13, color: tema.textoSuave }}>
                    Importe um backup anterior, exporte o estado atual e envie o conteúdo restaurado para o Supabase quando desejar.
                  </div>
                </div>
                <div
                  style={{
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    background: sessao ? "#F0FDF4" : "#FFFFFF",
                    border: `1px solid ${sessao ? "#BBF7D0" : tema.borda}`,
                    color: sessao ? "#166534" : tema.textoSuave,
                  }}
                >
                  {sessao ? "Destino local + nuvem" : "Destino somente local"}
                </div>
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${tema.borda}`,
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Backups e restauracao</div>
                <div style={{ fontSize: 12, color: tema.textoSuave, marginBottom: 12 }}>
                  Importe um backup JSON antigo para substituir os dados atuais. Se a conta estiver conectada, o
                  mesmo backup sobe para o Supabase logo em seguida.
                </div>

                <input
                  ref={inputBackupRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={importarBackupJSON}
                  style={{ display: "none" }}
                />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 11, color: tema.textoSuave }}>Ultimo backup lido</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, wordBreak: "break-word" }}>
                      {nomeArquivoImportado || "Nenhum arquivo importado ainda"}
                    </div>
                  </div>
                  <div style={{ background: "#FFF7ED", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 11, color: "#9A3412" }}>Destino</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: "#9A3412" }}>
                      {sessao ? "Local + Supabase" : "Somente local"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    onClick={abrirSeletorBackup}
                    disabled={importandoBackup || sincronizandoNuvem}
                    style={{
                      border: "1px solid #BFDBFE",
                      background: "#EFF6FF",
                      color: "#1D4ED8",
                      borderRadius: 10,
                      padding: "8px 12px",
                      cursor: importandoBackup || sincronizandoNuvem ? "wait" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {importandoBackup ? "Importando..." : "Importar backup JSON"}
                  </button>
                  <button
                    onClick={exportarJSON}
                    style={{
                      border: `1px solid ${tema.borda}`,
                      background: "#FFFFFF",
                      color: tema.texto,
                      borderRadius: 10,
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Exportar JSON
                  </button>
                  <button
                    onClick={exportarCSV}
                    style={{
                      border: `1px solid ${tema.borda}`,
                      background: "#FFFFFF",
                      color: tema.texto,
                      borderRadius: 10,
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Exportar CSV
                  </button>
                </div>

                <div style={{ fontSize: 12, color: tema.textoSuave, marginTop: 12 }}>
                  Backup compatível confirmado com o formato exportado pelo app, incluindo protocolo, marcacoes,
                  preferencias e migracoes.
                </div>
              </div>
            </div>
          </div>
        )}

        {aba === 5 && (
          <div>
            <div
              style={{
                background: tema.superficie,
                border: `1px solid ${tema.borda}`,
                borderRadius: 14,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Historico de adesao</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: tema.textoSuave }}>Ultimos 7 dias</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{historico7d.pct}%</div>
                  <div style={{ fontSize: 13 }}>{historico7d.feitas} de {historico7d.total} doses</div>
                </div>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: tema.textoSuave }}>Mes atual</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{historicoMes.pct}%</div>
                  <div style={{ fontSize: 13 }}>{historicoMes.feitas} de {historicoMes.total} doses</div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: tema.superficie,
                border: `1px solid ${tema.borda}`,
                borderRadius: 14,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Diario clinico consolidado</div>
              <div style={{ fontSize: 13, color: tema.textoSuave, marginBottom: 12 }}>
                Esse bloco organiza o historico manual de tirzepatida e retatrutida que voce me passou, com fases, datas, doses e pesos.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: tema.textoSuave }}>Aplicacoes no diario</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{resumoClinico.total}</div>
                </div>
                <div style={{ background: "#FFF7ED", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: "#9A3412" }}>Tirzepatida</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#C2410C" }}>{resumoClinico.tirzepatida}</div>
                </div>
                <div style={{ background: "#ECFEFF", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: "#115E59" }}>Retatrutida</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0F766E" }}>{resumoClinico.retatrutida}</div>
                </div>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: tema.textoSuave }}>Primeiro registro</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{formatarDataCurta(resumoClinico.primeiro?.data || dataHoje)}</div>
                  <div style={{ fontSize: 13 }}>{resumoClinico.primeiro?.peso || "-"}</div>
                </div>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: tema.textoSuave }}>Ultimo registro</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{formatarDataCurta(resumoClinico.ultimo?.data || dataHoje)}</div>
                  <div style={{ fontSize: 13 }}>{resumoClinico.ultimo?.peso || "-"}</div>
                </div>
                <div style={{ background: "#EFF6FF", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: "#1D4ED8" }}>Variacao no diario</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#1D4ED8" }}>{resumoClinico.variacaoRegistradaTexto}</div>
                  <div style={{ fontSize: 12, color: tema.textoSuave }}>Calculada entre o 1o e o ultimo peso listados.</div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: tema.superficie,
                border: `1px solid ${tema.borda}`,
                borderRadius: 14,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Fases do protocolo</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {fasesClinicas.map((fase) => (
                  <div
                    key={fase.id}
                    style={{
                      background: "#FFFFFF",
                      border: `1px solid ${fase.destaque}`,
                      borderLeft: `5px solid ${fase.destaque}`,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <strong style={{ fontSize: 15 }}>{fase.titulo}</strong>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: fase.tipo === "washout" ? "#475569" : fase.destaque,
                          background: fase.tipo === "washout" ? "#F1F5F9" : "#FFFFFF",
                        }}
                      >
                        {fase.tipo === "washout" ? "Pausa" : `${fase.totalAplicacoes} aplic.`}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: tema.textoSuave }}>{fase.subtitulo}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>Periodo: {fase.periodoExibicao}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Contexto: {fase.medicacao}</div>
                    <div style={{ fontSize: 13, marginTop: 8 }}>{fase.resumo}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: tema.superficie,
                border: `1px solid ${tema.borda}`,
                borderRadius: 14,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Notas clinicas e objetivos</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{NOTAS_CLINICAS.situacaoTitulo}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                    {NOTAS_CLINICAS.situacao.map((linha) => (
                      <div key={linha}>{linha}</div>
                    ))}
                  </div>
                </div>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Linha do tempo resumida</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                    {NOTAS_CLINICAS.linhaTempo.map((linha) => (
                      <div key={linha}>{linha}</div>
                    ))}
                  </div>
                </div>
                <div style={{ background: "#F0FDF4", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#166534" }}>Fase atual</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>{NOTAS_CLINICAS.faseAtual}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, marginTop: 10 }}>
                    {NOTAS_CLINICAS.objetivos.map((linha) => (
                      <div key={linha}>{linha}</div>
                    ))}
                  </div>
                </div>
                <div style={{ background: "#EFF6FF", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#1D4ED8" }}>Evolucao global informada</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                    {NOTAS_CLINICAS.evolucaoGlobal.map((linha) => (
                      <div key={linha}>{linha}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: tema.superficie,
                border: `1px solid ${tema.borda}`,
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Aplicacoes registradas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {HISTORICO_CLINICO.map((item) => {
                  const corItem = item.composto === "Tirzepatida" ? "#C2410C" : "#0F766E";
                  return (
                    <div
                      key={item.aplicacao}
                      style={{
                        background: "#FFFFFF",
                        border: `1px solid ${tema.borda}`,
                        borderLeft: `5px solid ${corItem}`,
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <strong style={{ fontSize: 15 }}>{item.aplicacao}a aplicacao</strong>
                        <span style={{ fontSize: 12, color: tema.textoSuave }}>{formatarDataCurta(item.data)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: tema.textoSuave, marginTop: 4 }}>
                        {item.composto} · {item.medicacao}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                        <span
                          style={{
                            background: "#F8FAFC",
                            border: `1px solid ${tema.borda}`,
                            borderRadius: 999,
                            padding: "4px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          Dose: {item.dose}
                        </span>
                        <span
                          style={{
                            background: "#F8FAFC",
                            border: `1px solid ${tema.borda}`,
                            borderRadius: 999,
                            padding: "4px 10px",
                            fontSize: 12,
                          }}
                        >
                          Peso: {item.peso}
                        </span>
                        {item.variacao && (
                          <span
                            style={{
                              background: "#F0FDF4",
                              border: "1px solid #BBF7D0",
                              color: "#166534",
                              borderRadius: 999,
                              padding: "4px 10px",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Variacao: {item.variacao}
                          </span>
                        )}
                      </div>
                      {item.observacoes && <div style={{ marginTop: 8, fontSize: 13 }}>{item.observacoes}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", padding: 14, borderTop: `1px solid ${tema.borda}` }}>
        <span style={{ fontSize: 11, color: tema.textoSuave }}>Jonathan · 2026-2027 · Nao substitui orientacao medica</span>
      </div>
    </div>
  );
}






















