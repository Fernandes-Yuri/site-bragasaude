import React from "react";
import {
  User,
  Mail,
  Phone,
  RefreshCw,
  LogOut,
  Users,
  ShieldCheck,
} from "lucide-react";
import type { FamilyBinding } from "../types";
import { WhatsAppLinkButton } from "./WhatsAppLinkButton";

interface ProfileScreenProps {
  caregiverName: string;
  email: string;
  phone: string;
  patientName: string;
  bindings: FamilyBinding[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onLinkWhatsApp: () => void;
  onConnectFamily: () => void;
  onLogout: () => void;
  /** Segredo TOTP (base32) do vinculo de WhatsApp; cliente gera, gateway guarda. */
  totpSecret?: string | null;
  /** Numero de WhatsApp ja vinculado (verificado pela Meta via webhook). */
  whatsappLinkedPhone?: string | null;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  caregiverName,
  email,
  phone,
  patientName,
  bindings,
  isRefreshing,
  onRefresh,
  onLinkWhatsApp,
  onConnectFamily,
  onLogout,
  totpSecret,
  whatsappLinkedPhone,
}) => {
  const initials = caregiverName
    ? caregiverName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((n) => n.charAt(0).toUpperCase())
        .join("")
    : "C";

  const activeBindings = bindings.filter((b) => b.status === "ACTIVE");

  return (
    <div className="space-y-4">
      {/* Cabeçalho do perfil com avatar */}
      <div className="bg-white rounded-3xl shadow-2xs border border-[#E5EBE8] p-5 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#26A69A] to-[#00897B] flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-emerald-900/20 border-2 border-white">
          {initials}
        </div>
        <div className="text-center min-w-0">
          <h2 className="text-lg font-bold text-[#1E293B] truncate">
            {caregiverName || "Cuidador"}
          </h2>
          <p className="text-xs text-[#64748B] truncate">
            Cuidador de {patientName || "paciente"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2F1] text-[#00897B] text-[11px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Conta protegida
        </span>
      </div>

      {/* Dados da conta */}
      <div className="bg-white rounded-3xl shadow-2xs border border-[#E5EBE8] divide-y divide-[#E5EBE8]">
        <div className="px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#00897B] flex items-center justify-center shrink-0">
            <Mail className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide">
              E-mail
            </p>
            <p className="text-sm font-semibold text-[#1E293B] truncate">{email}</p>
          </div>
        </div>

        <button
          onClick={onLinkWhatsApp}
          className="w-full px-5 py-3.5 flex items-center gap-3 active:bg-[#F8FAFC] transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#00897B] flex items-center justify-center shrink-0">
            <Phone className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide">
              WhatsApp
            </p>
            <p className="text-sm font-semibold text-[#1E293B] truncate">
              {phone || "Não vinculado — tocar para vincular"}
            </p>
          </div>
          {!phone && (
            <span className="px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100] text-[10px] font-bold shrink-0">
              Vincular
            </span>
          )}
        </button>
      </div>

      {/* Vinculo WhatsApp por TOTP (temporario ate a Meta liberar template).
          Toque unico abre o WhatsApp com o codigo atual pronto para enviar. */}
      <div className="bg-white rounded-3xl shadow-2xs border border-[#E5EBE8] p-5">
        <h3 className="text-sm font-bold text-[#1E293B] mb-2">Vincular WhatsApp</h3>
        <WhatsAppLinkButton
          totpSecret={totpSecret}
          alreadyLinked={!!whatsappLinkedPhone}
        />
      </div>

      {/* Grupo familiar — todos os cuidadores conectados */}
      <div className="bg-white rounded-3xl shadow-2xs border border-[#E5EBE8] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-[#00897B]" />
            <h3 className="text-sm font-bold text-[#1E293B]">Grupo de cuidados</h3>
          </div>
          <span className="text-[11px] font-bold text-[#64748B]">
            {activeBindings.length} conectado{activeBindings.length === 1 ? "" : "s"}
          </span>
        </div>

        {activeBindings.length === 0 ? (
          <p className="text-xs text-[#64748B] leading-relaxed mb-3">
            Nenhum familiar conectado ainda. Todos que você conectar compartilham o
            mesmo chat de mensagens.
          </p>
        ) : (
          <div className="space-y-2 mb-3">
            {activeBindings.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2.5 bg-[#F8FAFC] rounded-2xl p-2.5"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#26A69A] to-[#00897B] flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {b.caregiverName?.trim()?.charAt(0)?.toUpperCase() || "F"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1E293B] truncate">
                    {b.caregiverName || "Familiar"}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] truncate">
                    {b.caregiverRelation || "Familiar"}
                  </p>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#26A69A] shrink-0" title="Online no grupo" />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onConnectFamily}
          className="w-full py-2.5 rounded-2xl bg-[#E0F2F1] text-[#00897B] text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <User className="w-4 h-4" />
          Conectar outro familiar
        </button>
        <p className="text-[10px] text-[#94A3B8] mt-2 leading-relaxed">
          Cada novo familiar entra automaticamente no chat em grupo de {patientName || "paciente"}.
        </p>
      </div>

      {/* Ações da conta */}
      <div className="bg-white rounded-3xl shadow-2xs border border-[#E5EBE8] divide-y divide-[#E5EBE8]">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full px-5 py-3.5 flex items-center gap-3 active:bg-[#F8FAFC] transition-colors text-left disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#00897B] flex items-center justify-center shrink-0">
            <RefreshCw className={`w-4.5 h-4.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#1E293B]">Atualizar dados</p>
            <p className="text-[11px] text-[#94A3B8]">
              {isRefreshing ? "Sincronizando..." : "Buscar sinais e mensagens mais recentes"}
            </p>
          </div>
        </button>

        <button
          onClick={onLogout}
          className="w-full px-5 py-3.5 flex items-center gap-3 active:bg-rose-50 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <LogOut className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-600">Sair da conta</p>
            <p className="text-[11px] text-[#94A3B8]">Encerrar sessão neste dispositivo</p>
          </div>
        </button>
      </div>

      <p className="text-center text-[10px] text-[#94A3B8] leading-relaxed px-4">
        O Braga Saúde é uma ferramenta de autocuidado e não substitui consultas médicas.
        Em emergências, ligue para o SAMU (192).
      </p>
    </div>
  );
};
