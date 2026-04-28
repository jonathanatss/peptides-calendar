
import { useEffect, useMemo, useState } from "react";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const ABAS = ["Hoje", "Semana", "Guia"];
const CHAVE_MARCADAS = "pc-doses-marcadas-v3";
const CHAVE_PROTOCOLO = "pc-protocolo-v1";
const CHAVE_PREFS = "pc-preferencias-v1";
const CHAVE_ANTIGA = "doses-marcadas-v2";
const CHAVE_ULTIMO_LEMBRETE = "pc-ultimo-lembrete";

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
  },
  {
    id: "motsc",
    nome: "MOTS-c",
    dose: "400mcg",
    horario: "Manha, antes do treino",
    emoji: "⚡",
    cor: "#7C3AED",
    corFundo: "#F5F3FF",
    corBorda: "#DDD6FE",
    diasSemana: ["Seg", "Ter", "Qui", "Sex", "Sab"],
    descricao: "Somente nos dias de treino.",
    reconstituicao: "10mg + 2ml BAC Water",
    unidades: 8,
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
  },
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

function sanitizarDose(dose) {
  return {
    ...dose,
    diasSemana: Array.isArray(dose.diasSemana) ? dose.diasSemana : [],
  };
}

function getDosesParaDia(dateStr, protocolo) {
  const dia = DIAS_SEMANA[parseDate(dateStr).getDay()];
  return protocolo.filter((dose) => dose.diasSemana.includes(dia));
}

async function salvarStorage(chave, valor) {
  const serializado = typeof valor === "string" ? valor : JSON.stringify(valor);
  try {
    if (window?.storage?.set) {
      await window.storage.set(chave, serializado);
    }
  } catch (_) {}
  try {
    localStorage.setItem(chave, serializado);
  } catch (_) {}
}

async function carregarStorage(chave) {
  try {
    if (window?.storage?.get) {
      const res = await window.storage.get(chave);
      if (res?.value != null) return res.value;
    }
  } catch (_) {}
  try {
    return localStorage.getItem(chave);
  } catch (_) {
    return null;
  }
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
  const [dataSelecionada, setDataSelecionada] = useState(hoje());
  const [semanaAtual, setSemanaAtual] = useState(inicioSemana(hoje()));
  const [ultimaAcao, setUltimaAcao] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [editandoProtocolo, setEditandoProtocolo] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);

  const dataHoje = hoje();
  const tema = prefs.altoContraste ? TEMA_ALTO_CONTRASTE : TEMA_PADRAO;

  useEffect(() => {
    let ativo = true;

    async function carregarTudo() {
      const [rawMarcadas, rawAntigo, rawProtocolo, rawPrefs] = await Promise.all([
        carregarStorage(CHAVE_MARCADAS),
        carregarStorage(CHAVE_ANTIGA),
        carregarStorage(CHAVE_PROTOCOLO),
        carregarStorage(CHAVE_PREFS),
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
          const carregado = JSON.parse(rawProtocolo);
          if (Array.isArray(carregado) && carregado.length > 0) {
            setProtocolo(carregado.map(sanitizarDose));
          }
        }
      } catch (_) {}

      try {
        if (rawPrefs) {
          const carregado = JSON.parse(rawPrefs);
          setPrefs((prev) => ({
            ...prev,
            ...carregado,
            horariosLembrete: {
              ...prev.horariosLembrete,
              ...(carregado?.horariosLembrete || {}),
            },
          }));
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
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
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
          descricao: "Ajuste conforme orientacao medica.",
          reconstituicao: "",
          unidades: null,
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

  function exportarJSON() {
    const payload = {
      exportadoEm: new Date().toISOString(),
      protocolo,
      marcadas,
      preferencias: prefs,
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
                marginBottom: 14,
              }}
            >
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
                          Dias: {dose.diasSemana.length === 7 ? "Todo dia" : dose.diasSemana.join(", ")}
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
                        <label style={{ fontSize: 12, gridColumn: "1 / -1" }}>
                          Descricao
                          <textarea
                            value={dose.descricao}
                            onChange={(e) => atualizarDose(dose.id, { descricao: e.target.value })}
                            style={{ width: "100%", marginTop: 2, minHeight: 56 }}
                          />
                        </label>
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
      </div>

      <div style={{ textAlign: "center", padding: 14, borderTop: `1px solid ${tema.borda}` }}>
        <span style={{ fontSize: 11, color: tema.textoSuave }}>Jonathan · 2026-2027 · Nao substitui orientacao medica</span>
      </div>
    </div>
  );
}
