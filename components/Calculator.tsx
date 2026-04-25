"use client";

import { useState } from "react";
import { Delete } from "lucide-react";

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [justEvaled, setJustEvaled] = useState(false);

  function handleDigit(d: string) {
    if (justEvaled) {
      setDisplay(d);
      setExpression(d);
      setJustEvaled(false);
      return;
    }
    const next = display === "0" ? d : display + d;
    setDisplay(next);
    setExpression((e) => e + d);
  }

  function handleOp(op: string) {
    setJustEvaled(false);
    setExpression((e) => (e || display) + " " + op + " ");
    setDisplay(op);
  }

  function handleDot() {
    if (justEvaled) { setDisplay("0."); setExpression("0."); setJustEvaled(false); return; }
    if (display.includes(".")) return;
    setDisplay((d) => d + ".");
    setExpression((e) => e + ".");
  }

  function handleEval() {
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expression})`)();
      const str = String(Math.round(result * 1e10) / 1e10);
      setLastResult(`${expression} = ${str}`);
      setDisplay(str);
      setExpression(str);
      setJustEvaled(true);
    } catch {
      setDisplay("Error");
      setExpression("");
    }
  }

  function handleClear() {
    setDisplay("0");
    setExpression("");
    setJustEvaled(false);
  }

  function handleBackspace() {
    if (justEvaled) { handleClear(); return; }
    const next = display.slice(0, -1) || "0";
    setDisplay(next);
    setExpression((e) => e.slice(0, -1));
  }

  function handlePercent() {
    try {
      const val = parseFloat(display) / 100;
      setDisplay(String(val));
      setExpression((e) => e.slice(0, -display.length) + String(val));
    } catch {}
  }

  function handleToggleSign() {
    try {
      const val = parseFloat(display) * -1;
      setDisplay(String(val));
      setExpression((e) => e.slice(0, -display.length) + String(val));
    } catch {}
  }

  const btn = (label: React.ReactNode, onClick: () => void, cls = "") => (
    <button
      key={String(label)}
      onClick={onClick}
      className={`flex items-center justify-center rounded-xl text-sm font-semibold h-10 transition active:scale-95 select-none ${cls}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-2 p-3 select-none">
      {/* Display */}
      <div className="rounded-xl p-3 mb-1" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {lastResult && (
          <div className="text-[10px] truncate mb-1" style={{ color: "var(--text-muted)" }}>{lastResult}</div>
        )}
        <div className="text-right text-2xl font-bold tracking-tight truncate" style={{ color: "var(--text)" }}>
          {display}
        </div>
        <div className="text-right text-[10px] truncate mt-0.5 h-4" style={{ color: "var(--text-muted)" }}>
          {expression}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {btn("C", handleClear, "bg-red-500/20 text-red-400 hover:bg-red-500/30")}
        {btn("+/-", handleToggleSign, "opacity-btn")}
        {btn("%", handlePercent, "opacity-btn")}
        {btn("÷", () => handleOp("/"), "op-btn")}
        {btn("7", () => handleDigit("7"), "num-btn")}
        {btn("8", () => handleDigit("8"), "num-btn")}
        {btn("9", () => handleDigit("9"), "num-btn")}
        {btn("×", () => handleOp("*"), "op-btn")}
        {btn("4", () => handleDigit("4"), "num-btn")}
        {btn("5", () => handleDigit("5"), "num-btn")}
        {btn("6", () => handleDigit("6"), "num-btn")}
        {btn("−", () => handleOp("-"), "op-btn")}
        {btn("1", () => handleDigit("1"), "num-btn")}
        {btn("2", () => handleDigit("2"), "num-btn")}
        {btn("3", () => handleDigit("3"), "num-btn")}
        {btn("+", () => handleOp("+"), "op-btn")}
        {btn("0", () => handleDigit("0"), "num-btn col-span-2")}
        {btn(".", handleDot, "num-btn")}
        {btn("=", handleEval, "eq-btn")}
      </div>
    </div>
  );
}
