import React from "react";
import { UserPlus } from "lucide-react";

interface EmeraldHeaderBannerProps {
  title?: string;
  subtitle?: string;
  patientName: string;
  avatarInitials?: string;
  onConnectFamily?: () => void;
  onOpenProfile?: () => void;
}

export const EmeraldHeaderBanner: React.FC<EmeraldHeaderBannerProps> = ({
  title = "Acompanhamento",
  subtitle = "Círculo Familiar e Cuidados",
  patientName,
  avatarInitials,
  onConnectFamily,
  onOpenProfile,
}) => {
  const initials =
    avatarInitials ||
    (patientName ? patientName.trim().charAt(0).toUpperCase() : "F");

  return (
    <header className="w-full bg-gradient-to-b from-[#26A69A] to-[#00897B] text-white rounded-b-[28px] shadow-md shadow-emerald-900/10 pt-safe px-5 pb-5 transition-all">
      {/* Barra de título e botões de ação */}
      <div className="flex items-center justify-between gap-3">
        {/* Avatar toca para abrir o Perfil */}
        <button
          onClick={onOpenProfile}
          disabled={!onOpenProfile}
          className="flex items-center gap-3 min-w-0 active:opacity-80 transition-opacity disabled:active:opacity-100"
          title="Abrir meu perfil"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-sm font-bold text-white shadow-inner shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white truncate">{title}</h1>
            <p className="text-xs text-emerald-100/90 font-medium truncate">{subtitle}</p>
          </div>
        </button>

        {/* Ações superiores — 1 único botão (perfil já abre pelo avatar à esquerda) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onConnectFamily && (
            <button
              onClick={onConnectFamily}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white"
              title="Conectar Familiar por Código"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
