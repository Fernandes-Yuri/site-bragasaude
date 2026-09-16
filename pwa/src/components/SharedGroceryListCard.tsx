import React from "react";
import { ShoppingCart, Check } from "lucide-react";
import type { GroceryItem } from "../types";

interface SharedGroceryListCardProps {
  items: GroceryItem[];
  patientName: string;
  onToggle: (id: string) => void;
}

export const SharedGroceryListCard: React.FC<SharedGroceryListCardProps> = ({
  items,
  patientName,
  onToggle,
}) => {
  const checkedCount = items.filter((i) => i.isCheckedInPantry).length;
  const progressPct = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-[#E5EBE8] shadow-sm">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center shrink-0">
          <ShoppingCart className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[#1E293B] truncate">Lista de compras</h3>
          <p className="text-xs text-[#64748B] truncate">
            Marque enquanto compra para {patientName || "seu familiar"}
          </p>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex-1 h-1.5 bg-[#E0F2F1] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00897B] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-[#00897B] shrink-0">
          {checkedCount}/{items.length}
        </span>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-1.5">
        {items.map((item) => {
          const isChecked = item.isCheckedInPantry;
          return (
            <div
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                isChecked
                  ? "bg-[#F8FAFC] opacity-65"
                  : "hover:bg-[#F4FBF9] bg-transparent"
              }`}
            >
              {/* Checkbox Circular */}
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  isChecked
                    ? "bg-[#00897B] border-[#00897B] text-white"
                    : "border-[#94A3B8] bg-white"
                }`}
              >
                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              {/* Detalhes do Alimento */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-tight truncate ${
                    isChecked
                      ? "line-through text-[#64748B]"
                      : "font-semibold text-[#1E293B]"
                  }`}
                >
                  {item.foodName}
                </p>
                <p className="text-[11px] text-[#64748B] truncate">
                  {item.purchaseUnitText} • {item.category}
                </p>
              </div>

              {/* Preço Estimado em R$ */}
              <span
                className={`text-xs font-semibold shrink-0 ${
                  isChecked ? "text-[#94A3B8]" : "text-[#1E293B]"
                }`}
              >
                R$ {item.estimatedPriceBrl.toFixed(2).replace(".", ",")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
