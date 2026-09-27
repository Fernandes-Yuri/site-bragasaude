import React, { useState, useRef, useCallback } from "react";
import { X, Sparkles, Check, Calendar, Mic } from "lucide-react";
import { askVoiceCopilot, synthesizePiperVoice, confirmVoiceDraft } from "../services/api";

interface VoiceAssistantProps {
  userId: string;
  // AUD-PW03: era idToken?: string — snapshot do estado capturada no
  // onAuthStateChanged, que NÃO dispara na renovação silenciosa do Firebase
  // (~1h). O token stale fazia o copiloto parar de responder (401 no gateway)
  // sem mensagem alguma. Agora cada chamada resolve o token fresco.
  getIdToken?: () => Promise<string | undefined>;
  patientName: string;
  actingAs?: "patient" | "caregiver";
  patientId?: string;
  onToast?: (msg: string, type?: "success" | "error") => void;
}

type AssistantState = "idle" | "listening" | "thinking" | "speaking";

/** Converte ISO -> "24/09/2026 às 14h00" (fuso de Brasilia). */
function formatarDataPt(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const hora = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${d.getFullYear()} às ${hora}h${min}`;
  } catch {
    return iso;
  }
}

/**
 * Copiloto de voz do cuidador: botão flutuante com interação
 * HOLD-TO-TALK (igual ao Android): segura pra falar, solta pra ouvir a resposta.
 * Segure novamente para falar de novo; solte ou toque no X pra parar.
 */
export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  userId,
  getIdToken,
  patientName,
  actingAs = "patient",
  patientId,
  onToast,
}) => {
  const [state, setState] = useState<AssistantState>("idle");
  const [panelOpen, setPanelOpen] = useState(false);
  const [lastReply, setLastReply] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");
  const [pendingDraft, setPendingDraft] = useState<{
    id: string;
    title: string;
    scheduledDate: string;
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // AUD-PW(B): audio Piper em reprodução — ver stopSpeaking.
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  // Guarda o texto capturado ao soltar o dedo (hold-to-talk)
  const pendingTranscriptRef = useRef<string>("");

  const speak = useCallback(
    async (text: string) => {
      try {
        const token = (await getIdToken?.()) || "";
        const blob = await synthesizePiperVoice(text, token);
        if (blob && blob.size > 0) {
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;
          setState("speaking");
          audio.onended = () => {
            setState("idle");
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            setState("idle");
            currentAudioRef.current = null;
          };
          await audio.play();
          return;
        }
      } catch (e) {
        console.warn("Piper indisponível, fallback para voz do sistema:", e);
      }

      try {
        if (!("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "pt-BR";
        utter.rate = 1.02;
        utter.onend = () => setState("idle");
        utter.onerror = () => setState("idle");
        setState("speaking");
        window.speechSynthesis.speak(utter);
      } catch (e) {
        console.warn("TTS indisponível:", e);
        setState("idle");
      }
    },
    [getIdToken]
  );

  const stopSpeaking = () => {
    try {
      const a = currentAudioRef.current;
      if (a) { a.pause(); a.src = ""; currentAudioRef.current = null; }
    } catch { /* noop */ }
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    setState("idle");
  };

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setState("idle");
  }, []);

  /**
   * Pergunta ao copiloto com o texto final da transcrição.
   */
  const handleAsk = useCallback(
    async (question: string) => {
      const clean = question.trim();
      if (!clean) return;

      setState("thinking");
      const token = await (getIdToken ? getIdToken() : Promise.resolve(undefined));
      const reply = await askVoiceCopilot(clean, userId, token, {
        actingAs,
        patientId,
        patientName,
      });

      if (!reply) {
        setLastReply("Não consegui me conectar agora. Verifique sua conexão e tente novamente.");
        setState("idle");
        onToast?.("Copiloto indisponível — sem conexão", "error");
        return;
      }

      setLastReply(reply.fala);
      speak(reply.fala);

      // D51: rascunho de agendamento — mostra o botão Confirmar
      if (reply.acao === "AGENDAR_RASCUNHO" && reply.parametros?.id) {
        setPendingDraft({
          id: String(reply.parametros.id),
          title: String(reply.parametros.title || "Consulta"),
          scheduledDate: String(reply.parametros.scheduledDate || ""),
        });
      } else {
        setPendingDraft(null);
      }
    },
    [userId, getIdToken, speak, onToast, actingAs, patientId, patientName]
  );

  const handleConfirmDraft = useCallback(async () => {
    if (!pendingDraft || !patientId) return;
    setIsConfirming(true);
    try {
      const res = await confirmVoiceDraft(
        patientId,
        pendingDraft.id,
        await (getIdToken ? getIdToken() : Promise.resolve(undefined))
      );
      if (res.ok) {
        const fala = res.fala || "Consulta confirmada! Já está na agenda.";
        setLastReply(fala);
        setPendingDraft(null);
        speak(fala);
      } else {
        const fala = res.fala || "Não consegui confirmar. Tente novamente.";
        setLastReply(fala);
        speak(fala);
      }
    } finally {
      setIsConfirming(false);
    }
  }, [pendingDraft, patientId, getIdToken, speak]);

  /**
   * HOLD-TO-TALK: começa a escutar quando o usuário aperta.
   * Funciona como o Android: segure → fale → solte → ouve a resposta.
   */
  const handlePressStart = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onToast?.("Seu navegador não suporta assistente por voz");
      return;
    }

    try {
      stopSpeaking();
      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.continuous = false;

      setTranscript("");
      setPanelOpen(true);

      rec.onstart = () => setState("listening");
      rec.onerror = () => setState("idle");
      rec.onend = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        // Ao soltar o dedo (onend), se houve transcrição, pergunta ao copiloto
        const finalText = pendingTranscriptRef.current.trim();
        if (finalText.length >= 2) {
          handleAsk(finalText);
        } else {
          setState("idle");
        }
      };
      rec.onresult = (event: any) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0]?.transcript || "";
        }
        setTranscript(text);
        pendingTranscriptRef.current = text;
      };

      recognitionRef.current = rec;
      rec.start();

      // Trava de segurança: se o silêncio durar 8s, encerra a escuta
      timeoutRef.current = setTimeout(() => {
        try { rec.stop(); } catch { /* noop */ }
      }, 8000);
    } catch (e) {
      console.warn("STT indisponível:", e);
      setState("idle");
      onToast?.("Não foi possível acessar o microfone", "error");
    }
  }, [handleAsk, onToast, stopSpeaking]);

  /**
   * SOLTAR O DEDO: para a escuta e dispara o processamento.
   * O onend do SpeechRecognition já chama handleAsk, mas se o usuário
   * soltar rapidamente antes de onend disparar, este método garante o processamento.
   */
  const handlePressEnd = useCallback(() => {
    // Para o reconhecimento — o onend vai disparar o handleAsk
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Se o reconhecimento não tinha processado ainda, processa o que tem
    const finalText = pendingTranscriptRef.current.trim();
    if (finalText.length >= 2 && state === "listening") {
      handleAsk(finalText);
    } else if (state === "listening") {
      setState("idle");
    }
  }, [handleAsk, state]);

  /**
   * Segurar e falar → soltar → ouve a resposta do Braga.
   * Enquanto está falando (state === "speaking"), pode apertar de novo pra falar.
   */
  const handleMainButtonDown = () => {
    if (state === "thinking") return; // Não interromper o processamento
    if (state === "idle") {
      handlePressStart();
    }
    // Se state === "listening", o usuário já está falando — não faz nada extra
  };

  const handleMainButtonUp = () => {
    if (state === "listening") {
      handlePressEnd();
    }
    // Se state === "speaking", não faz nada — deixa terminar
    // Se state === "thinking", não faz nada
  };

  const handleMainButtonClick = () => {
    // Click normal (sem hold) → abre/fecha o painel se estiver idle
    if (state === "idle") {
      setPanelOpen((prev) => !prev);
    } else if (state === "speaking") {
      stopSpeaking();
    } else if (state === "thinking") {
      // Não interromper o pensamento
    }
  };

  const stateLabel: Record<AssistantState, string> = {
    idle: "Segure e fale",
    listening: "🗣️ Falando... solte para ouvir",
    thinking: "Pensando...",
    speaking: "Falando... toque para parar",
  };

  const isActive = state !== "idle";

  // Proteção: se não há paciente vinculado, não deixa abrir o painel
  const hasNoPatient = !patientId || patientId === "";

  return (
    <>
      {/* Botão flutuante do assistente */}
      <button
        onMouseDown={handleMainButtonDown}
        onMouseUp={handleMainButtonUp}
        onTouchStart={handleMainButtonDown}
        onTouchEnd={handleMainButtonUp}
        onClick={handleMainButtonClick}
        className={`fixed bottom-20 right-4 z-50 flex items-center gap-2 pl-3.5 pr-4 py-3 rounded-full font-bold text-xs shadow-lg transition-all active:scale-95 ${
          isActive
            ? "bg-[#1E293B] text-white"
            : "bg-gradient-to-b from-[#26A69A] to-[#00897B] text-white shadow-emerald-900/30"
        }`}
        aria-label={stateLabel[state]}
      >
        {state === "listening" ? (
          <Mic className="w-4 h-4 animate-pulse" />
        ) : isActive ? (
          <X className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        <span>{stateLabel[state]}</span>
      </button>

      {/* Painel de conversa */}
      {panelOpen && (
        <div className="fixed bottom-32 right-3 left-3 max-w-md mx-auto z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E5EBE8] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#26A69A] to-[#00897B] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1E293B]">Braga, seu copiloto</p>
                  <p className="text-[12px] text-[#64748B]">
                    Cuidando de {patientName || "paciente"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopSpeaking();
                  stopListening();
                  setPanelOpen(false);
                }}
                aria-label="Fechar"
                className="w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Aviso quando não há paciente vinculado */}
            {hasNoPatient && (
              <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-2xl px-3.5 py-3">
                <p className="text-[12px] font-bold text-[#F57F17] mb-1">
                  ⚠️ Nenhum familiar conectado
                </p>
                <p className="text-[12px] text-[#64748B] leading-relaxed">
                  Conecte um familiar na aba Início para usar o copiloto de voz.
                </p>
              </div>
            )}

            {transcript && !hasNoPatient && (
              <div className="bg-[#F1F5F9] rounded-2xl px-3.5 py-2.5">
                <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wide mb-0.5">
                  Você disse
                </p>
                <p className="text-[13px] text-[#1E293B] leading-snug">{transcript}</p>
              </div>
            )}

            {state === "thinking" && !hasNoPatient && (
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-[#00897B] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#00897B] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#00897B] animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="text-[12px] text-[#64748B] ml-1">Consultando...</span>
              </div>
            )}

            {lastReply && (
              <div className="bg-[#E0F2F1] rounded-2xl px-3.5 py-2.5">
                <p className="text-[12px] font-bold text-[#00897B] uppercase tracking-wide mb-0.5">
                  Braga responde
                </p>
                <p className="text-[13px] text-[#1E293B] leading-snug">{lastReply}</p>
                {state === "speaking" && (
                  <button
                    onClick={stopSpeaking}
                    className="mt-2 text-[12px] font-bold text-[#00897B] active:opacity-70"
                  >
                    Parar de falar
                  </button>
                )}
              </div>
            )}

            {/* D51: rascunho de agendamento — botão Confirmar na tela */}
            {pendingDraft && (
              <div className="bg-white rounded-2xl border border-[#00897B]/30 px-3.5 py-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#00897B] shrink-0" />
                  <p className="text-[12px] font-bold text-[#00897B] uppercase tracking-wide">
                    Aguardando sua confirmação
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-[#1E293B]">
                    {pendingDraft.title}
                  </p>
                  <p className="text-[12px] text-[#64748B]">
                    {formatarDataPt(pendingDraft.scheduledDate)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmDraft}
                    disabled={isConfirming}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#00897B] text-white text-xs font-bold py-2 rounded-xl active:scale-95 transition-all disabled:opacity-60"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isConfirming ? "Confirmando..." : "Confirmar"}
                  </button>
                  <button
                    onClick={() => {
                      setPendingDraft(null);
                      setLastReply(
                        "Tudo bem. Pode me dizer a correção, por exemplo: 'na verdade é sexta às 15h'."
                      );
                    }}
                    disabled={isConfirming}
                    className="px-3 bg-[#F1F5F9] text-[#64748B] text-xs font-bold py-2 rounded-xl active:scale-95 transition-all"
                  >
                    Corrigir
                  </button>
                </div>
              </div>
            )}

            {!transcript && !lastReply && state === "idle" && !hasNoPatient && (
              <p className="text-[12px] text-[#64748B] leading-relaxed">
                Segure o botão e fale para tirar dúvidas sobre os sinais vitais,
                hidratação ou medicação de {patientName || "paciente"}.
              </p>
            )}

            {!transcript && !lastReply && state === "idle" && hasNoPatient && (
              <p className="text-[12px] text-[#64748B] leading-relaxed">
                Conecte um familiar para habilitar o copiloto de voz.
              </p>
            )}

            <p className="text-[12px] text-[#64748B] leading-tight text-center">
              Apoio ao cuidado — não substitui orientação médica. Emergências: SAMU 192.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
