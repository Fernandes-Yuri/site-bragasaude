import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Mic, Volume2 } from "lucide-react";
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
  // AUD-PW03: era idToken?: string — uma snapshot capturada no onAuthStateChanged.
  // O Firebase só dispara esse callback em login/logout, NÃO na renovação
  // silenciosa do token (~1h). O idToken em estado envelhecia, o gateway
  // passava a rejeitar com 401 e o chat sumia sem explicação. Agora resolvemos
  // o token fresco no instante de cada chamada.
  getIdToken?: () => Promise<string | undefined>;
  onToast?: (msg: string) => void;
}

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
}) => {
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const requestSequence = useRef(0);

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
    // Voz Piper do gateway (mesma do Android, "faber"); fallback na do aparelho
    try {
      // AUD-PW03: token fresco — a voz somem após ~1h com token stale.
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

    // Otimismo: mostra a mensagem imediatamente
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
      // AUD-PW03: token fresco no envio — mensagem silenciosamente perdida
      // após ~1h era sintoma do token stale.
      await (getIdToken ? getIdToken() : Promise.resolve(undefined))
    );
    if (!result.delivered) {
      setError("Mensagem não entregue. Tente enviar novamente.");
      setInput(clean);
      onToast?.("Mensagem não entregue — verifique sua conexão");
    }
    // Recarrega para alinhar com o estado real do gateway
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

  if (!patientId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm font-semibold text-[#1E293B] mb-1">
            Selecione um grupo da família
          </p>
          <p className="text-xs text-[#64748B]">
            Escolha a família acima ou conecte um familiar na aba Início.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header do grupo */}
      <div className="px-4 py-2.5 border-b border-[#E5EBE8] bg-white">
        <p className="text-sm font-bold text-[#1E293B]">Chat da família</p>
        <p className="text-[12px] text-[#64748B]">
          Grupo de {patientName || "paciente"} · todos os cuidadores veem esta conversa
        </p>
      </div>

      {/* Lista de mensagens */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-[#F8FAFC]"
      >
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-[#64748B] text-center max-w-[220px] leading-relaxed">
              Nenhuma mensagem ainda. Mande um carinho para {patientName || "paciente"}
            </p>
          </div>
        )}

        {messages.map((m) => {
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
