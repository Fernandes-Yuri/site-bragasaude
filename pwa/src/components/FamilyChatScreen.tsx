import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, Mic, Volume2, ArrowLeft, User } from "lucide-react";
import {
  fetchFamilyMessages,
  sendCaregiverMessage,
  synthesizePiperVoice,
  QUICK_TEMPLATES,
} from "../services/api";
import type { FamilyMessage } from "../types";

interface FamilyChatScreenProps {
  patientId: string;
  patientName: string;
  currentUserId: string;
  caregiverName: string;
  getIdToken?: () => Promise<string | undefined>;
  onToast?: (msg: string) => void;
  onBackToInbox?: () => void;
  onOpenProfile?: () => void;
}

const MAX_VISIBLE_MESSAGES = 25;

/**
 * Chat em grupo da família: todos os cuidadores vinculados ao mesmo patient_id
 * compartilham a conversa. A autorização é validada no gateway
 * (require_family_access), então 1 ou 5 familiares veem o mesmo histórico.
 *
 * Voz: o microfone dita a mensagem via Web Speech API (SpeechRecognition);
 * o botão de alto-falante lê a mensagem em voz alta via SpeechSynthesis.
 */
export const FamilyChatScreen: React.FC<FamilyChatScreenProps> = ({
  patientId,
  patientName,
  currentUserId,
  caregiverName,
  getIdToken,
  onToast,
  onBackToInbox,
  onOpenProfile,
}) => {
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const requestSequence = useRef(0);

  // Mensagens visíveis: só as últimas MAX_VISIBLE_MESSAGES para não estourar a tela
  const visibleMessages = useMemo(() => {
    if (messages.length <= MAX_VISIBLE_MESSAGES) return messages;
    return messages.slice(-MAX_VISIBLE_MESSAGES);
  }, [messages]);

  const hasMoreMessages = messages.length > MAX_VISIBLE_MESSAGES;

  // Carrega mensagens (e re-carrega para refrescar o grupo)
  const loadMessages = useCallback(async () => {
    if (!patientId) return;
    const sequence = ++requestSequence.current;
    // AUD-PW03: token resolvido no momento da chamada (nunca stale).
    try {
      const token = await getIdToken?.();
      const fresh = await fetchFamilyMessages(patientId, token, 50);
      if (sequence === requestSequence.current) {
        setMessages(fresh.slice().reverse());
        setError(null);
      }
    } catch {
      if (sequence !== requestSequence.current) return;
      setMessages([]);
      setError("Não foi possível atualizar o grupo. Verifique sua conexão e o vínculo.");
    }
  }, [patientId, getIdToken]);

  useEffect(() => {
    loadMessages();
    // Polling leve: atualiza o grupo a cada 15s enquanto a aba está aberta
    const interval = setInterval(loadMessages, 15000);
    return () => { clearInterval(interval); requestSequence.current++; recognitionRef.current?.stop(); };
  }, [loadMessages]);

  useEffect(() => {
    const timer = setInterval(() => setMessages(previous => {
      const valid = previous.filter(message => Date.parse(message.expiresAt) > Date.now());
      return valid.length === previous.length ? previous : valid;
    }), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll para a mensagem mais recente
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = async (text: string) => {
    try {
      const token = (await getIdToken?.()) || "";
      const blob = await synthesizePiperVoice(text, token);
      if (blob && blob.size > 0) {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        audio.onerror = () => URL.revokeObjectURL(url);
        await audio.play();
        return;
      }
    } catch (e) {
      console.warn("Piper indisponível, fallback na voz do sistema:", e);
    }
    try {
      if (!("speechSynthesis" in window)) {
        onToast?.("Seu navegador não suporta leitura por voz");
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "pt-BR";
      utter.rate = 1;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("TTS indisponível:", e);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onToast?.("Seu navegador não suporta ditado por voz");
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onstart = () => setIsListening(true);
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      rec.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim() || "";
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.warn("STT indisponível:", e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      /* noop */
    }
    setIsListening(false);
  };

  const sendMessage = async (text: string) => {
    const clean = text.trim();
    if (!clean || isSending) return;
    setError(null);
    setIsSending(true);

    const now = new Date().toISOString();
    const optimistic: FamilyMessage = {
      id: `pending-${Date.now()}`,
      patientId,
      senderId: currentUserId,
      senderName: caregiverName,
      messageText: clean,
      iconType: "LOVE",
      sentAt: now,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
    const result = await sendCaregiverMessage(
      patientId,
      clean,
      "LOVE",
      caregiverName,
      currentUserId,
      await (getIdToken ? getIdToken() : Promise.resolve(undefined))
    );
    if (!result.delivered) {
      setError("Mensagem não entregue. Tente enviar novamente.");
      setInput(clean);
      onToast?.("Mensagem não entregue — verifique sua conexão");
    }
    await loadMessages();
    } catch {
      setInput(clean);
      setMessages(prev => prev.filter(message => message.id !== optimistic.id));
      setError("Mensagem não entregue. Tente enviar novamente.");
    } finally { setIsSending(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // GUARDA: se não há paciente vinculado, mostra aviso em vez de crashar
  if (!patientId || patientId === "") {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#E0F2F1] flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-[#00897B]" />
          </div>
          <p className="text-sm font-semibold text-[#1E293B] mb-1">
            Nenhum familiar conectado
          </p>
          <p className="text-xs text-[#64748B] max-w-[240px] leading-relaxed">
            Conecte um familiar na aba Início ou use o código de 8 dígitos
            para começar a acompanhar a saúde dele.
          </p>
        </div>
      </div>
    );
  }

  // GUARDA: se patientName é vazio, usa fallback seguro
  const safePatientName = patientName || "Familiar";
  const safeInitials = (safePatientName.trim().charAt(0).toUpperCase()) || "F";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header da conversa interativo com avatar e perfil */}
      <div className="px-3.5 py-2.5 border-b border-[#E5EBE8] bg-white flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {onBackToInbox && (
            <button
              type="button"
              onClick={onBackToInbox}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-slate-100 active:scale-95 transition-all shrink-0"
              title="Voltar para conversas"
              aria-label="Voltar para conversas"
            >
              <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
            </button>
          )}

          {/* Avatar com inicial — SEMPRE clicável quando onOpenProfile existe */}
          {onOpenProfile ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="w-10 h-10 rounded-full bg-gradient-to-b from-[#26A69A] to-[#00897B] flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              title="Ver perfil do familiar"
              aria-label="Ver perfil do familiar"
            >
              {safeInitials}
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#26A69A] to-[#00897B] flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-xs">
              {safeInitials}
            </div>
          )}

          {/* Nome e subtítulo interativo */}
          <div
            className={`min-w-0 flex-1 ${onOpenProfile ? "cursor-pointer" : ""}`}
            onClick={onOpenProfile}
            title={onOpenProfile ? "Toque para ver o perfil" : undefined}
          >
            <p className="text-sm font-bold text-[#1E293B] truncate leading-tight">
              {safePatientName}
            </p>
            <p className="text-[11px] text-[#00897B] font-medium truncate">
              {onOpenProfile ? "Toque para ver perfil e vínculo" : "Conversa ativa · 24h efêmera"}
            </p>
          </div>
        </div>

        {/* Ações do header */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#00897B] hover:bg-[#E0F2F1] active:scale-95 transition-all"
              title="Perfil do familiar"
              aria-label="Perfil do familiar"
            >
              <User className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de mensagens — só mostra as últimas para não estourar */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-[#F8FAFC]"
      >
        {hasMoreMessages && (
          <p className="text-center text-[12px] text-[#64748B] py-2">
            ↓ {messages.length - MAX_VISIBLE_MESSAGES} mensagens mais antigas
          </p>
        )}

        {visibleMessages.length === 0 && !hasMoreMessages && (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-[#64748B] text-center max-w-[220px] leading-relaxed">
              Nenhuma mensagem ainda. Mande um carinho para {safePatientName}
            </p>
          </div>
        )}

        {visibleMessages.map((m) => {
          const isMine = m.senderId === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                  isMine
                    ? "bg-[#00897B] rounded-br-md"
                    : "bg-white border border-[#E5EBE8] rounded-bl-md"
                }`}
              >
                {!isMine && (
                  <p className="text-[12px] font-bold text-[#00897B] mb-0.5">
                    {m.senderName || "Familiar"}
                  </p>
                )}
                <p
                  className={`text-[13px] leading-snug break-words ${
                    isMine ? "text-white" : "text-[#1E293B]"
                  }`}
                >
                  {m.messageText}
                </p>
                <div
                  className={`flex items-center gap-1.5 mt-1 ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <span
                    className={`text-[12px] ${
                      isMine ? "text-emerald-100/80" : "text-[#64748B]"
                    }`}
                  >
                    {formatTime(m.sentAt)}
                  </span>
                  {!isMine && (
                    <button
                      onClick={() => speak(m.messageText)}
                      className="opacity-60 hover:opacity-100 active:scale-95 transition-all"
                      title="Ouvir mensagem"
                      aria-label="Ouvir mensagem"
                    >
                      <Volume2 className="w-3 h-3 text-[#00897B]" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-[12px] text-rose-600 px-4 py-1 text-center">{error}</p>
      )}

      {/* Templates rápidos */}
      <div className="px-3 py-2 border-t border-[#E5EBE8] bg-white">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {Object.values(QUICK_TEMPLATES).map((t) => (
            <button
              key={t.key}
              onClick={() => sendMessage(t.text)}
              disabled={isSending}
              className="shrink-0 px-2.5 py-1.5 rounded-full bg-[#E0F2F1] text-[#00897B] text-[12px] font-semibold active:scale-95 transition-all disabled:opacity-50"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campo de entrada com microfone */}
      <form
        onSubmit={handleSubmit}
        className="px-3 py-2.5 border-t border-[#E5EBE8] bg-white flex items-center gap-2 pb-safe"
      >
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
            isListening
              ? "bg-rose-500 text-white animate-pulse"
              : "bg-[#E0F2F1] text-[#00897B]"
          }`}
          title={isListening ? "Parar ditado" : "Ditar por voz"}
          aria-label={isListening ? "Parar ditado" : "Ditar por voz"}
        >
          <Mic className="w-4.5 h-4.5" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Ouvindo..." : "Escreva uma mensagem..."}
          disabled={isSending}
          className="flex-1 min-w-0 px-4 py-2.5 rounded-2xl bg-[#F1F5F9] text-sm text-[#1E293B] placeholder:text-[#64748B] outline-none focus:ring-2 focus:ring-[#00897B]/30"
        />

        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="shrink-0 w-10 h-10 rounded-full bg-[#00897B] text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100"
          title="Enviar"
          aria-label="Enviar"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>
    </div>
  );
};
