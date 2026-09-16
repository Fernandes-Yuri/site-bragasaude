import React, { useState } from "react";
import { MessageSquareHeart, Send, Heart, Droplet, Pill, Sparkles, Clock } from "lucide-react";
import type { FamilyMessage } from "../types";

import { sendFamilyMessage } from "../services/api";

interface FamilyMessagesSectionProps {
  messages: FamilyMessage[];
  patientId: string;
  patientName: string;
}

export const FamilyMessagesSection: React.FC<FamilyMessagesSectionProps> = ({
  messages: initialMessages,
  patientId,
  patientName,
}) => {
  const [messages, setMessages] = useState<FamilyMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<"LOVE" | "MEDICATION" | "WATER" | "HEART">("LOVE");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSending(true);
    const newMsg = await sendFamilyMessage(patientId, text.trim(), selectedIcon, "Você (Cuidador)");
    setMessages([newMsg, ...messages]);
    setText("");
    setIsSending(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "MEDICATION":
        return <Pill className="w-4 h-4 text-emerald-400" />;
      case "WATER":
        return <Droplet className="w-4 h-4 text-cyan-400" />;
      case "HEART":
        return <Heart className="w-4 h-4 text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center text-pink-400">
            <MessageSquareHeart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-white">Ponte Familiar (Recados)</h4>
            <p className="text-[11px] text-slate-400">Aparecem no app e o Braga lê em voz alta</p>
          </div>
        </div>

        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          24h TTL
        </span>
      </div>

      {/* Input de envio rápido */}
      <form onSubmit={handleSend} className="space-y-2 mb-3">
        <div className="relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Envie um carinho para ${patientName.split(" ")[0]}...`}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10"
          />
          <button
            type="submit"
            disabled={!text.trim() || isSending}
            className="absolute right-1.5 top-1.5 w-8 h-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-lg flex items-center justify-center text-white transition-all shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Escolha do ícone de afeto */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Tipo de recado:</span>
          <div className="flex gap-1.5">
            {[
              { id: "LOVE", label: "Carinho" },
              { id: "MEDICATION", label: "Remédio" },
              { id: "WATER", label: "Água" },
              { id: "HEART", label: "Saúde" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIcon(item.id as any)}
                className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                  selectedIcon === item.id
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Lista de mensagens efêmeras */}
      <div className="space-y-2 mt-3 pt-3 border-t border-slate-800/80">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
              {getIcon(msg.iconType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-200 truncate">{msg.senderName}</span>
                <span className="text-[10px] text-slate-500">{msg.sentAt}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words">{msg.messageText}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">Expira automaticamente em 24h</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
