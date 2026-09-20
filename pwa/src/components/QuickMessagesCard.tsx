import React from "react";
import { Droplet, Pill, Footprints, Heart, MessageCircle } from "lucide-react";
import type { MessageTemplate } from "../types";

interface QuickMessagesCardProps {
  templates: Record<string, MessageTemplate>;
  onSend: (key: string) => void;
}

export const QuickMessagesCard: React.FC<QuickMessagesCardProps> = ({ templates, onSend }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "water":
        return <Droplet className="w-5 h-5 text-[#0277BD]" />;
      case "medication":
        return <Pill className="w-5 h-5 text-[#E65100]" />;
      case "walk":
        return <Footprints className="w-5 h-5 text-[#2E7D32]" />;
      case "love":
        return <Heart className="w-5 h-5 text-[#D9532F] fill-[#D9532F]/20" />;
      default:
        return <MessageCircle className="w-5 h-5 text-[#00897B]" />;
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-[#E5EBE8] shadow-sm">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
          <MessageCircle className="w-4 h-4" />
        </div>
        <h3 className="text-base font-bold text-[#1E293B]">Mensagens rápidas</h3>
      </div>
      <p className="text-xs text-[#64748B] mb-4">
        Um toque e o recado chega na tela do seu familiar.
      </p>

      {/* Grid de Modelos Oficiais */}
      <div className="grid grid-cols-3 gap-2.5">
        {Object.values(templates).map((template) => (
          <button
            key={template.key}
            onClick={() => onSend(template.key)}
            className="bg-[#FAFCFB] hover:bg-[#F4FBF9] active:scale-95 border border-[#E5EBE8] rounded-xl p-3 flex flex-col items-center text-center justify-center gap-1.5 transition-all shadow-2xs group"
          >
            <div className="p-1 rounded-lg group-hover:scale-110 transition-transform">
              {getIcon(template.iconType)}
            </div>
            <span className="text-[12px] font-semibold text-[#1E293B] leading-tight line-clamp-2">
              {template.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
