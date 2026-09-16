import React from "react";
import { MessageCircle, UserPlus, RefreshCw } from "lucide-react";

interface EmeraldHeaderBannerProps {
  title?: string;
  subtitle?: string;
  patientName: string;
  avatarInitials?: string;
  onRefresh?: () => void;
  onConnectFamily?: () => void;
  onOpenChat?: () => void;
}

export const EmeraldHeaderBanner: React.FC<EmeraldHeaderBannerProps> = ({
  title = "Acompanhamento",
  subtitle = "Círculo Familiar e Cuidados",
  patientName,
  avatarInitials,
  onRefresh,
  onConnectFamily,
  onOpenChat,
}) => {
  const initials =
    avatarInitials ||
    (patientName ? patientName.trim().charAt(0).toUpperCase() : "F");

  return (
    <header className="w-full bg-gradient-to-b from-[#26A69A] to-[#00897B] text-white rounded-b-[28px] shadow-md shadow-emerald-900/10 pt-safe px-5 pb-5 transition-all">
      {/* Barra de título e botões de ação */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-sm font-bold text-white shadow-inner">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
            <p className="text-xs text-emerald-100/90 font-medium">{subtitle}</p>
          </div>
        </div>

        {/* Ações superiores */}
        <div className="flex items-center gap-1.5">
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white"
              title="Recados da Família"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}

          {onConnectFamily && (
            <button
              onClick={onConnectFamily}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white"
              title="Conectar Familiar por Código"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
