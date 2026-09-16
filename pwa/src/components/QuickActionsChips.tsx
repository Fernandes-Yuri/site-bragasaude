import React from "react";
import { Pill, Calendar, MessageCircle, Users } from "lucide-react";

interface QuickActionsChipsProps {
  onMedicationReminder: () => void;
  onAppointment: () => void;
  onCareNote: () => void;
  onFamilyPost: () => void;
}

export const QuickActionsChips: React.FC<QuickActionsChipsProps> = ({
  onMedicationReminder,
  onAppointment,
  onCareNote,
  onFamilyPost,
}) => {
  const actions = [
    {
      id: "med",
      label: "Medicação",
      icon: Pill,
      color: "#E65100",
      bgColor: "rgba(230, 81, 0, 0.08)",
      borderColor: "rgba(230, 81, 0, 0.2)",
      onClick: onMedicationReminder,
    },
    {
      id: "app",
      label: "Consulta",
      icon: Calendar,
      color: "#6A1B9A",
      bgColor: "rgba(106, 27, 154, 0.08)",
      borderColor: "rgba(106, 27, 154, 0.2)",
      onClick: onAppointment,
    },
    {
      id: "msg",
      label: "Mensagem",
      icon: MessageCircle,
      color: "#AD1457",
      bgColor: "rgba(173, 20, 87, 0.08)",
      borderColor: "rgba(173, 20, 87, 0.2)",
      onClick: onCareNote,
    },
    {
      id: "fam",
      label: "Família",
      icon: Users,
      color: "#2E7D32",
      bgColor: "rgba(46, 125, 50, 0.08)",
      borderColor: "rgba(46, 125, 50, 0.2)",
      onClick: onFamilyPost,
    },
  ];

  return (
    <div className="w-full">
      <h3 className="text-sm font-bold text-[#1E293B] mb-2.5">Ações rápidas</h3>
      <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {actions.map((act) => {
          const IconComp = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              style={{
                backgroundColor: act.bgColor,
                borderColor: act.borderColor,
                color: act.color,
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border font-semibold text-xs shrink-0 active:scale-95 transition-all shadow-2xs"
            >
              <IconComp className="w-4 h-4" />
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
