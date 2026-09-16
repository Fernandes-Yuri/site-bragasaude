import React, { useState } from "react";
import { X, Pill, Calendar, Heart, Send } from "lucide-react";

interface MedicationReminderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
}

export const MedicationReminderDialog: React.FC<MedicationReminderDialogProps> = ({
  isOpen,
  onClose,
  onSend,
}) => {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#E5EBE8] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFF3E0] text-[#E65100] flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#1E293B] text-base">Lembrete de Medicação</h3>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
          Chega na tela do seu familiar com o seu nome como remetente.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex: Mãe, não esquece do remédio da pressão depois do café."
            rows={3}
            className="w-full bg-[#FAFCFB] border border-[#E2E8F0] rounded-2xl p-3 text-sm text-[#1E293B] focus:border-[#00897B] focus:ring-1 focus:ring-[#00897B] outline-hidden resize-none mb-4"
          />

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#1E293B]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#00897B] hover:bg-[#00695C] disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar lembrete</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (specialty: string, dateStr: string) => void;
}

export const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  isOpen,
  onClose,
  onSend,
}) => {
  const [specialty, setSpecialty] = useState("");
  const [date, setDate] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialty.trim() || !date) return;
    onSend(specialty.trim(), date);
    setSpecialty("");
    setDate("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#E5EBE8]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F3E5F5] text-[#6A1B9A] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#1E293B] text-base">Consulta Médica</h3>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#1E293B] block mb-1">Especialidade / Médico</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ex: Cardiologista Dr. Carlos"
              className="w-full bg-[#FAFCFB] border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#1E293B] focus:border-[#00897B] outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1E293B] block mb-1">Data e Horário</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#FAFCFB] border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#1E293B] focus:border-[#00897B] outline-hidden"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#64748B]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!specialty.trim() || !date}
              className="px-5 py-2.5 rounded-xl bg-[#00897B] disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Salvar consulta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CareNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
}

export const CareNoteDialog: React.FC<CareNoteDialogProps> = ({ isOpen, onClose, onSend }) => {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#E5EBE8]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFF5F2] text-[#D9532F] flex items-center justify-center">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <h3 className="font-bold text-[#1E293B] text-base">Bilhete de Carinho</h3>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#64748B] mb-4">
          Um recado personalizado que aparece em destaque na tela do celular do seu familiar.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva uma mensagem cheia de afeto..."
            rows={3}
            className="w-full bg-[#FAFCFB] border border-[#E2E8F0] rounded-2xl p-3 text-sm text-[#1E293B] focus:border-[#00897B] outline-hidden resize-none mb-4"
          />

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#64748B]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#00897B] disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar bilhete</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
