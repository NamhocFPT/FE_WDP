// src/component/ui/index.js
import React from "react";
import ReactDOM from "react-dom";

export function cn(...xs) {
    return xs.filter(Boolean).join(" ");
}

export function Button({ variant = "primary", className, ...props }) {
    const base =
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition active:scale-[0.99]";
    const styles = {
        primary: "bg-slate-900 text-white hover:bg-slate-800",
        outline: "border border-slate-200 bg-white hover:bg-slate-50",
        ghost: "bg-transparent hover:bg-slate-100",
        danger: "bg-red-600 text-white hover:bg-red-500",
    };
    return <button className={cn(base, styles[variant], className)} {...props} />;
}

export function Input({ className, ...props }) {
    return (
        <input
            className={cn(
                "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200",
                className
            )}
            {...props}
        />
    );
}

export function Badge({ tone = "slate", className, children }) {
    const tones = {
        slate: "bg-slate-100 text-slate-700",
        green: "bg-emerald-100 text-emerald-700",
        red: "bg-red-100 text-red-700",
        blue: "bg-blue-100 text-blue-700",
        amber: "bg-amber-100 text-amber-700",
    };
    return (
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", tones[tone], className)}>
            {children}
        </span>
    );
}

export function Card({ className, ...props }) {
    return <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)} {...props} />;
}
export function CardHeader({ className, ...props }) {
    return <div className={cn("border-b border-slate-100 px-4 py-3", className)} {...props} />;
}
export function CardTitle({ className, ...props }) {
    return <div className={cn("text-sm font-semibold text-slate-900", className)} {...props} />;
}
export function CardContent({ className, ...props }) {
    return <div className={cn("px-4 py-4", className)} {...props} />;
}

export function Table({ className, ...props }) {
    return <table className={cn("w-full text-sm", className)} {...props} />;
}
export function Th({ className, ...props }) {
    return <th className={cn("border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700", className)} {...props} />;
}
export function Td({ className, ...props }) {
    return <td className={cn("border-b border-slate-100 px-3 py-2 text-slate-700", className)} {...props} />;
}

export function PageHeader({ title, subtitle, right }) {
    return (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-xl font-bold text-slate-900">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
            </div>
            {right ? <div className="flex gap-2">{right}</div> : null}
        </div>
    );
}

export function StatCard({ label, value, hint }) {
    return (
        <Card>
            <CardContent>
                <div className="text-xs font-semibold text-slate-500">{label}</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
                {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
            </CardContent>
        </Card>
    );
}

export function MiniBarChart({ data }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <div className="flex items-end gap-2">
            {data.map((d) => (
                <div key={d.month} className="flex flex-col items-center gap-1">
                    <div
                        className="w-6 rounded-md bg-slate-900/80"
                        style={{ height: `${Math.round((d.value / max) * 90) + 10}px` }}
                        title={`${d.month}: ${d.value}`}
                    />
                    <div className="text-[10px] text-slate-500">{d.month}</div>
                </div>
            ))}
        </div>
    );
}

export function Modal({ open, title, children, onClose }) {
    if (!open) return null;
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={onClose}>
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div className="text-sm font-semibold text-slate-900">{title}</div>
                    <Button variant="ghost" onClick={onClose}>
                        ✕
                    </Button>
                </div>
                <div className="px-4 py-4">{children}</div>
            </div>
        </div>,
        document.body
    );
}