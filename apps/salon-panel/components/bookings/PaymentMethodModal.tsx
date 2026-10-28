"use client";

import { useState } from "react";
import { X, Banknote, CreditCard, Smartphone, MoreHorizontal } from "lucide-react";

type PaymentMethod = "cash" | "card" | "upi" | "other";

interface PaymentMethodModalProps {
  open: boolean;
  onConfirm: (method: PaymentMethod) => void;
  onClose: () => void;
  loading?: boolean;
}

const METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote; color: string }[] = [
  { value: "cash", label: "Cash", icon: Banknote, color: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" },
  { value: "card", label: "Card", icon: CreditCard, color: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" },
  { value: "upi", label: "UPI", icon: Smartphone, color: "bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100" },
];

export default function PaymentMethodModal({ open, onConfirm, onClose, loading }: PaymentMethodModalProps) {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);

  if (!open) return null;

  const handleConfirm = () => {
    if (selected) onConfirm(selected);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-1">Payment Method</h3>
        <p className="text-sm text-slate-500 mb-5">How did the customer pay?</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {METHODS.map((m) => {
            const Icon = m.icon;
            const isSelected = selected === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setSelected(m.value)}
                className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-[#0071e3] bg-blue-50 ring-2 ring-[#0071e3]/20"
                    : `border-slate-200 ${m.color}`
                }`}
              >
                <Icon size={24} className={isSelected ? "text-[#0071e3]" : ""} />
                <span className={`text-sm font-semibold ${isSelected ? "text-[#0071e3]" : ""}`}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Completing..." : "Complete Service"}
          </button>
        </div>
      </div>
    </div>
  );
}
