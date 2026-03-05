import React from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Loader2 } from "lucide-react";

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false, loading = false }) {
    if (!isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl flex flex-col overflow-hidden">
                <div className="flex justify-between items-start p-5 pb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-5 pb-6 text-slate-600 text-sm">
                    {message}
                </div>

                <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex items-center gap-2 px-4 py-2 text-white font-medium rounded-xl transition-colors disabled:opacity-50
                            ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
