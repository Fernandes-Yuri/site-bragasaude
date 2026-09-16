import React, { useState } from "react";
import { X, TrendingUp, Activity, Droplet } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface ChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
}

const PRESSURE_DATA = [
  { day: "Qui", sys: 128, dia: 82 },
  { day: "Sex", sys: 125, dia: 80 },
  { day: "Sáb", sys: 130, dia: 84 },
  { day: "Dom", sys: 120, dia: 78 },
  { day: "Seg", sys: 124, dia: 81 },
  { day: "Ter", sys: 126, dia: 83 },
  { day: "Hoje", sys: 122, dia: 81 },
];

const GLUCOSE_DATA = [
  { day: "Qui", value: 98 },
  { day: "Sex", value: 102 },
  { day: "Sáb", value: 95 },
  { day: "Dom", value: 91 },
  { day: "Seg", value: 96 },
  { day: "Ter", value: 99 },
  { day: "Hoje", value: 94 },
];

export const ChartsModal: React.FC<ChartsModalProps> = ({ isOpen, onClose, patientName }) => {
  const [metric, setMetric] = useState<"pressure" | "glucose">("pressure");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Evolução dos Sinais Vitais</h3>
            <p className="text-xs text-slate-400">Acompanhamento dos últimos 7 dias · {patientName}</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMetric("pressure")}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              metric === "pressure" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4 text-rose-400" />
            Pressão Arterial
          </button>
          <button
            type="button"
            onClick={() => setMetric("glucose")}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              metric === "glucose" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-slate-400 hover:text-white"
            }`}
          >
            <Droplet className="w-4 h-4 text-amber-400" />
            Glicemia em Jejum
          </button>
        </div>

        {/* Chart Container */}
        <div className="w-full h-64 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-center">
          {metric === "pressure" ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PRESSURE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[60, 160]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px" }}
                />
                <ReferenceLine y={120} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Ótima (120)", fill: "#10b981", fontSize: 10 }} />
                <ReferenceLine y={140} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "Limite (140)", fill: "#f43f5e", fontSize: 10 }} />
                <Line type="monotone" dataKey="sys" name="Sistólica" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="dia" name="Diastólica" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={GLUCOSE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[70, 140]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px" }}
                />
                <ReferenceLine y={99} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Normal (<100)", fill: "#10b981", fontSize: 10 }} />
                <Line type="monotone" dataKey="value" name="Glicemia (mg/dL)" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 px-1">
          <span>Diretrizes: Sociedade Brasileira de Cardiologia (SBC)</span>
          <span className="text-emerald-400 font-semibold">Tendência Estável</span>
        </div>
      </div>
    </div>
  );
};
