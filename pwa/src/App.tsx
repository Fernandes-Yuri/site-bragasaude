import React, { useState } from "react";
import {
  Heart,
  QrCode,
  ShieldCheck,
  AlertCircle,
  PhoneCall,
  Bell,
} from "lucide-react";
import {
  MOCK_PATIENT,
  MOCK_VITALS,
  MOCK_MEDICATIONS,
  MOCK_HYDRATION,
  MOCK_MESSAGES,
} from "./services/api";
import { InstallBanner } from "./components/InstallBanner";
import { VitalsSection } from "./components/VitalsSection";
import { MedicationsSection } from "./components/MedicationsSection";
import { HydrationCard } from "./components/HydrationCard";
import { FamilyMessagesSection } from "./components/FamilyMessagesSection";
import { QrPairingModal } from "./components/QrPairingModal";
import { ChartsModal } from "./components/ChartsModal";

export const App: React.FC = () => {
  const [patient, setPatient] = useState(MOCK_PATIENT);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isChartsOpen, setIsChartsOpen] = useState(false);
  const [emergencyAlert] = useState<string | null>(null);

  const handleSuccessPair = (newName: string) => {
    setPatient({
      ...patient,
      name: newName,
      lastActive: "Agora mesmo",
      status: "healthy",
      statusMessage: "Novo familiar pareado com sucesso!",
    });
  };

  const handleEmergencyCall = () => {
    window.location.href = "tel:192";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Header com Safe Area iOS */}
      <header className="pt-safe px-4 pb-3 border-b border-slate-800/80 bg-slate-950/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/50">
              <Heart className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-base tracking-tight text-white">BRAGA SAÚDE</h1>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                  Cuidador
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Modo Familiar · iOS Standalone</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPairingOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500 transition-colors"
              title="Conectar novo familiar via QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500 transition-colors relative"
              title="Notificações"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-slate-950" />
            </button>
          </div>
        </div>

        {/* Card do Paciente em Destaque */}
        <div className="mt-3.5 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 border border-emerald-800/30 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center font-bold text-emerald-300 text-sm shadow-inner">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">{patient.name}</span>
                <span className="text-[11px] text-slate-400">({patient.relationship})</span>
              </div>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ativa {patient.lastActive}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium inline-block">
              {patient.statusMessage}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-1 pb-24 overflow-y-auto">
        {/* Banner de Instalação no iOS */}
        <InstallBanner />

        {/* Alerta de Emergência se Houver */}
        {emergencyAlert && (
          <div className="bg-rose-950/90 border border-rose-600 rounded-2xl p-3.5 mb-4 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-bold">{emergencyAlert}</p>
                <p className="text-[11px] text-rose-200">Verifique com o paciente imediatamente.</p>
              </div>
            </div>
            <button
              onClick={handleEmergencyCall}
              className="bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Ligar
            </button>
          </div>
        )}

        {/* 1. Sinais Vitais */}
        <VitalsSection vitals={MOCK_VITALS} onOpenCharts={() => setIsChartsOpen(true)} />

        {/* 2. Medicamentos do Dia */}
        <MedicationsSection medications={MOCK_MEDICATIONS} patientName={patient.name} />

        {/* 3. Hidratação */}
        <HydrationCard hydration={MOCK_HYDRATION} patientName={patient.name} />

        {/* 4. Mensagens Efêmeras de Afeto (Ponte Familiar) */}
        <FamilyMessagesSection
          messages={MOCK_MESSAGES}
          patientId={patient.id}
          patientName={patient.name}
        />

        {/* Botão de Ajuda e Contato Rápido */}
        <div className="pt-2">
          <button
            onClick={handleEmergencyCall}
            className="w-full bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 rounded-2xl p-3.5 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold transition-all shadow-sm"
          >
            <PhoneCall className="w-4 h-4 text-rose-400" />
            <span>Contato de Emergência / SAMU 192</span>
          </button>
        </div>
      </main>

      {/* Bottom Bar para iOS */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-lg pb-safe pt-2 px-6 flex items-center justify-between text-slate-400 text-[10px] z-40">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Monitoramento Seguro</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <span>Braga Saúde v1.0.0</span>
          <span>·</span>
          <span>braga-saude.web.app</span>
        </div>
      </footer>

      {/* Modais */}
      <QrPairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        onSuccessPair={handleSuccessPair}
      />

      <ChartsModal
        isOpen={isChartsOpen}
        onClose={() => setIsChartsOpen(false)}
        patientName={patient.name}
      />
    </div>
  );
};

export default App;
