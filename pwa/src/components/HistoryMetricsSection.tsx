import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { VitalHistoryRecord } from "../types";

interface HistoryMetricsSectionProps {
  history7d: VitalHistoryRecord[];
}

export const HistoryMetricsSection: React.FC<HistoryMetricsSectionProps> = ({ history7d }) => {
  const [period, setPeriod] = useState<"7d" | "30d">("7d");
  const [metricTab, setMetricTab] = useState<"pressure" | "glucose">("pressure");

  const chartData = history7d.map((item) => ({
    date: item.measuredAt.slice(5), // MM-DD
    sistolica: item.systolic,
    diastolica: item.diastolic,
    glicose: item.glucose,
  }));

  const avgSystolic = Math.round(
    history7d.reduce((acc, curr) => acc + (curr.systolic || 0), 0) / history7d.length
  );
  const avgDiastolic = Math.round(
    history7d.reduce((acc, curr) => acc + (curr.diastolic || 0), 0) / history7d.length
  );
  const avgGlucose = Math.round(
    history7d.reduce((acc, curr) => acc + (curr.glucose || 0), 0) / history7d.length
  );

  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-[#E5EBE8] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#1E293B]">Histórico e Tendências</h3>
          <p className="text-xs text-[#64748B]">Evolução dos sinais vitais</p>
        </div>

        {/* Seletor de período */}
        <div className="flex bg-[#F1F5F9] p-1 rounded-xl gap-1">
          <button
            onClick={() => setPeriod("7d")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              period === "7d"
                ? "bg-white text-[#00897B] shadow-xs"
                : "text-[#64748B] hover:text-[#1E293B]"
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setPeriod("30d")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              period === "30d"
                ? "bg-white text-[#00897B] shadow-xs"
                : "text-[#64748B] hover:text-[#1E293B]"
            }`}
          >
            30 dias
          </button>
        </div>
      </div>

      {/* Médias no período */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          onClick={() => setMetricTab("pressure")}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            metricTab === "pressure"
              ? "bg-[#E0F2F1]/50 border-[#00897B]"
              : "bg-[#F8FAFC] border-[#E2E8F0]"
          }`}
        >
          <span className="text-[11px] text-[#64748B] block font-medium">Média Pressão</span>
          <span className="text-lg font-bold text-[#1E293B]">
            {avgSystolic}/{avgDiastolic}{" "}
            <span className="text-[10px] text-[#64748B] font-normal">mmHg</span>
          </span>
        </div>

        <div
          onClick={() => setMetricTab("glucose")}
          className={`cursor-pointer p-3 rounded-xl border transition-all ${
            metricTab === "glucose"
              ? "bg-[#FFF3E0] border-[#E65100]"
              : "bg-[#F8FAFC] border-[#E2E8F0]"
          }`}
        >
          <span className="text-[11px] text-[#64748B] block font-medium">Média Glicose</span>
          <span className="text-lg font-bold text-[#1E293B]">
            {avgGlucose}{" "}
            <span className="text-[10px] text-[#64748B] font-normal">mg/dL</span>
          </span>
        </div>
      </div>

      {/* Gráfico de Linhas Clean */}
      <div className="h-44 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            {metricTab === "pressure" ? (
              <>
                <Line
                  type="monotone"
                  dataKey="sistolica"
                  stroke="#00897B"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#00897B" }}
                  name="Sistólica"
                />
                <Line
                  type="monotone"
                  dataKey="diastolica"
                  stroke="#26A69A"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "#26A69A" }}
                  name="Diastólica"
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="glicose"
                stroke="#E65100"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#E65100" }}
                name="Glicose"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
