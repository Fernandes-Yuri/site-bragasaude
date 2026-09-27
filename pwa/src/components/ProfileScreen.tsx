import React, { useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  RefreshCw,
  LogOut,
  Users,
  ShieldCheck,
  ChevronRight,
  Pencil,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import type { FamilyBinding } from "../types";
import { WhatsAppLinkButton } from "./WhatsAppLinkButton";
import { Avatar } from "./Avatar";
import { openWhatsAppVinculo } from "../services/waLinkTotp";

interface ProfileScreenProps {
  caregiverName: string;
  email: string;
  phone: string;
  patientName: string;
  bindings: FamilyBinding[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onConnectFamily: () => void;
  onLogout: () => void;
  /** Segredo TOTP (base32) do vinculo de WhatsApp; cliente gera, gateway guarda. */
  totpSecret?: string | null;
  /** Numero de WhatsApp ja vinculado (verificado pela Meta via webhook). */
  whatsappLinkedPhone?: string | null;
  onOpenMemberProfile?: (binding: FamilyBinding) => void;
  /** Foto de perfil do proprio usuario (custom ou Google) — null usa iniciais. */
  photoUrl?: string | null;
  /** Sobe a foto escolhida (resize + upload feitos pelo App). */
  onUploadPhoto?: (file: File) => Promise<void>;
  /** Remove a foto e volta ao fallback de iniciais. */
  onRemovePhoto?: () => Promise<void>;
  /** Fotos de perfil dos familiares por userId (grupo de cuidados). */
  memberPhotos?: Record<string, string>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  caregiverName,
  email,
  phone,
  patientName,
  bindings,
  isRefreshing,
  onRefresh,
  onConnectFamily,
  onLogout,
  totpSecret,
  whatsappLinkedPhone,
  onOpenMemberProfile,
  photoUrl,
  onUploadPhoto,
  onRemovePhoto,
  memberPhotos,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);
  // Sheet de origem da foto: tirar agora (camera) ou escolher da galeria.
  const [showPhotoSource, setShowPhotoSource] = useState(false);
  const [waLinkMsg, setWaLinkMsg] = useState<string | null>(null);

  const handlePickPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onUploadPhoto) return;
    setIsPhotoBusy(true);
    try {
      await onUploadPhoto(file);
    } finally {
      setIsPhotoBusy(false);
    }
  };

  // Linha "Nao vinculado — tocar para vincular": era um botao morto (sem
  // onClick). Agora dispara o mesmo fluxo do botao verde de baixo.
  const handleVincularWhatsApp = async () => {
    if (!totpSecret) {
      setWaLinkMsg("Vínculo disponível assim que seu cadastro for concluído.");
      return;
    }
    setWaLinkMsg(null);
    try {
      await openWhatsAppVinculo(totpSecret);
      setWaLinkMsg("WhatsApp aberto — envie a mensagem para concluir o vínculo.");
    } catch (err) {
      setWaLinkMsg(err instanceof Error ? err.message : "Não foi possível abrir o WhatsApp.");
    }
  };

  const handleRemovePhoto = async () => {
    if (!onRemovePhoto) return;
    setIsPhotoBusy(true);
    try {
      await onRemovePhoto();
    } finally {
      setIsPhotoBusy(false);
    }
  };

  const activeBindings = bindings.filter((b) => b.status === "ACTIVE");

  return (
    <div className="space-y-4">
      {/* Cabeçalho do perfil com avatar */}
      <div className="bg-white rounded-3xl shadow-2xs border border-[#E5EBE8] p-5 flex flex-col items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPhotoSource(true)}
            disabled={isPhotoBusy}
            title="Editar foto de perfil"
            aria-label="Editar foto de perfil"
            className="relative block rounded-full active:scale-98 transition-all disabled:opacity-60"
          >
            <Avatar
              name={caregiverName}
              photoUrl={photoUrl}
              className="w-20 h-20 bg-gradient-to-b from-[#26A69A] to-[#00897B] shadow-lg shadow-emerald-900/20 border-2 border-white"
              textClassName="text-2xl"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00897B] border-2 border-white flex items-center justify-center text-white shadow-sm pointer-events-none">
              <Pencil className="w-3.5 h-3.5" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePickPhoto}
          />
          {/* capture="user" obriga o navegador mobile a abrir a camera
              frontal direto (selfie) — era a opcao que faltava. Em desktop
              sem camera, o navegador ignora capture e abre o seletor. */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handlePickPhoto}
          />
        </div>
        <div className="text-center min-w-0">
          <h2 className="text-lg font-bold text-[#1E293B] truncate">
            {caregiverName || "Cuidador"}
          </h2>
          <p className="text-xs text-[#64748B] truncate">
            Cuidador de {patientName || "paciente"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2F1] text-[#00897B] text-[12px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Conta protegida
        </span>
        {photoUrl && onRemovePhoto && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            disabled={isPhotoBusy}
            className="text-[12px] text-[#64748B] underline underline-offset-2 disabled:opacity-60"
          >
            {isPhotoBusy ? "Removendo..." : "Remover foto"}
          </button>
        )}
      </div>

      {/* Dados da conta */}
      <div className="bg-white rounded-3xl shadow-2xs border border-[#E5EBE8] divide-y divide-[#E5EBE8]">
        <div className="px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#00897B] flex items-center justify-center shrink-0">
            <Mail className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wide">
              E-mail
            </p>
            <p className="text-sm font-semibold text-[#1E293B] truncate">{email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleVincularWhatsApp}
          disabled={isPhotoBusy}
          className="w-full px-5 py-3.5 flex items-center gap-3 active:bg-[#F8FAFC] transition-colors text-left disabled:opacity-60"
        >
          <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#00897B] flex items-center justify-center shrink-0">
            <Phone className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wide">
              WhatsApp
            </p>
            <p className="text-sm font-semibold text-[#1E293B] truncate">
              {phone || "Não vinculado — tocar para vincular"}
            </p>
          </div>
          {!phone && (
            <span className="px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100] text-[12px] font-bold shrink-0">
              Vincular
            </span>
          )}
        </button>
        {waLinkMsg && !phone && (
          <p className="px-5 pb-3 text-[12px] text-[#64748B] leading-snug" role="status">
            {waLinkMsg}
          </p>
        )}
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
          <span className="text-[12px] font-bold text-[#64748B]">
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
            {activeBindings.map((b) => {
              const memberName = b.patientName || b.caregiverName || "Familiar";
              const memberPhoto = b.patientName
                ? memberPhotos?.[b.patientUserId]
                : memberPhotos?.[b.caregiverUserId];
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-2.5 bg-[#F8FAFC] rounded-2xl p-2.5 hover:bg-[#F1F5F9] transition-colors"
                >
                  <Avatar
                    name={memberName}
                    photoUrl={memberPhoto}
                    className="w-8 h-8 bg-gradient-to-b from-[#26A69A] to-[#00897B]"
                    textClassName="text-xs"
                  />
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => onOpenMemberProfile?.(b)}
                  >
                    <p className="text-sm font-semibold text-[#1E293B] truncate">
                      {memberName}
                    </p>
                    <p className="text-[12px] text-[#64748B] truncate">
                      {b.caregiverRelation || "Familiar"}
                    </p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#26A69A] shrink-0" title="Online no grupo" />
                  {onOpenMemberProfile && (
                    <button
                      type="button"
                      onClick={() => onOpenMemberProfile(b)}
                      className="p-1 rounded-lg text-slate-400 hover:text-[#00897B] hover:bg-emerald-50 active:scale-95 transition-all shrink-0"
                      title="Ver perfil e vínculo"
                      aria-label="Ver perfil e vínculo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onConnectFamily}
          className="w-full py-2.5 rounded-2xl bg-[#E0F2F1] text-[#00897B] text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <User className="w-4 h-4" />
          Conectar outro familiar
        </button>
        <p className="text-[12px] text-[#64748B] mt-2 leading-relaxed">
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
            <p className="text-[12px] text-[#64748B]">
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
            <p className="text-[12px] text-[#64748B]">Encerrar sessão neste dispositivo</p>
          </div>
        </button>
      </div>

      <p className="text-center text-[12px] text-[#64748B] leading-relaxed px-4">
        O Braga Saúde é uma ferramenta de autocuidado e não substitui consultas médicas.
        Em emergências, ligue para o SAMU (192).
      </p>

      {/* Sheet de origem da foto: tirar agora (camera frontal) ou escolher
          da galeria — antes so existia o seletor de arquivos. */}
      {showPhotoSource && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setShowPhotoSource(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-4 pb-6 space-y-2 border-t border-[#E5EBE8] animate-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Escolher origem da foto"
          >
            <p className="text-sm font-bold text-[#1E293B] px-2 pt-1">Foto de perfil</p>
            <button
              type="button"
              onClick={() => {
                setShowPhotoSource(false);
                cameraInputRef.current?.click();
              }}
              className="w-full px-4 py-3.5 flex items-center gap-3 rounded-2xl bg-[#E0F2F1] text-[#00897B] font-semibold text-sm active:scale-98 transition-all"
            >
              <Camera className="w-5 h-5" />
              Tirar foto agora
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPhotoSource(false);
                fileInputRef.current?.click();
              }}
              className="w-full px-4 py-3.5 flex items-center gap-3 rounded-2xl bg-[#F8FAFC] border border-[#E5EBE8] text-[#1E293B] font-semibold text-sm active:scale-98 transition-all"
            >
              <ImageIcon className="w-5 h-5 text-[#64748B]" />
              Escolher da galeria
            </button>
            <button
              type="button"
              onClick={() => setShowPhotoSource(false)}
              className="w-full px-4 py-3 rounded-2xl text-[#64748B] font-semibold text-sm active:bg-[#F8FAFC] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
