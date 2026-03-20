import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, UploadCloud, Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "service/adminApi";
import * as XLSX from "xlsx";

export default function ImportScheduleModal({ isOpen, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    
    // Preview States
    const [previewData, setPreviewData] = useState(null); // { validRows: [], invalidRows: [] }
    const [activeTab, setActiveTab] = useState("valid"); // "valid" | "invalid"

    useEffect(() => {
        if (isOpen) {
            setFile(null);
            setPreviewData(null);
            setActiveTab("valid");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const parseScheduleFromFile = (uploadedFile) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[firstSheetName];
                
                // Trả về mảng 2D (mảng các mảng hàng)
                const rows2D = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
                if (rows2D.length <= 1) {
                    toast.error("File excel trống hoặc thiếu dữ liệu.");
                    return;
                }

                // Cột Assumed: 0: Mã Lớp, 1: Email GV, 2: Ngày, 3: Bắt đầu, 4: Kết thúc, 5: Phòng, 6: Chủ đề
                const headers = rows2D[0];
                const rows = [];
                
                for (let i = 1; i < rows2D.length; i++) {
                    const r = rows2D[i];
                    if (!r || r.length === 0) continue;

                    rows.push({
                        class_name: r[0] ? String(r[0]).trim() : "",
                        teacher_email: r[1] ? String(r[1]).trim() : "",
                        date: r[2] ? String(r[2]).trim() : "",
                        start_time: r[3] ? String(r[3]).trim() : "",
                        end_time: r[4] ? String(r[4]).trim() : "",
                        room: r[5] ? String(r[5]).trim() : "",
                        topic: r[6] ? String(r[6]).trim() : "Class session"
                    });
                }

                if (rows.length === 0) {
                    toast.error("Không đọc được bản ghi nào.");
                    return;
                }

                setLoading(true);
                setFile(uploadedFile);

                // Call Validate API
                const res = await adminApi.validateScheduleImport(rows);
                if (res.data.success) {
                    setPreviewData(res.data.data);
                    if (res.data.data.invalid_count > 0) {
                        setActiveTab("invalid");
                        toast.warning(`Tìm thấy ${res.data.data.invalid_count} dòng bị lỗi.`);
                    } else {
                        setActiveTab("valid");
                        toast.success(`Tìm thấy ${res.data.data.valid_count} dòng hợp lệ.`);
                    }
                }
            } catch (error) {
                console.error("Parse fail:", error);
                toast.error("Lỗi đọc file: " + (error.response?.data?.message || error.message));
                setFile(null);
            } finally {
                setLoading(false);
            }
        };

        reader.readAsArrayBuffer(uploadedFile);
    };

    const handleFileChange = (e) => {
        const targetFile = e.target.files[0];
        if (targetFile) parseScheduleFromFile(targetFile);
    };

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        if (e.dataTransfer.files?.[0]) parseScheduleFromFile(e.dataTransfer.files[0]);
    };

    const handleConfirmImport = async () => {
        if (!previewData || previewData.validRows.length === 0) return;
        setLoading(true);
        try {
            await adminApi.confirmScheduleImport(previewData.validRows);
            toast.success("Import lịch học thành công!");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi import thực tế.");
        } finally {
            setLoading(false);
        }
    };

    const renderTable = (rows, type) => {
        if (!rows || rows.length === 0) return <p className="text-center text-slate-400 py-4 text-sm">Không có dữ liệu</p>;
        return (
            <div className="overflow-x-auto border rounded-xl">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Dòng</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Lớp</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">GV Email</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Ngày</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Giờ</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Phòng</th>
                            {type === "invalid" && <th className="px-3 py-2 text-left text-xs font-semibold text-red-600">Lý do</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {rows.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50 text-xs">
                                <td className="px-3 py-2 text-slate-600">{r.rowNum || i+1}</td>
                                <td className="px-3 py-2 font-medium text-slate-800">{r.class_name}</td>
                                <td className="px-3 py-2 text-slate-600">{r.teacher_email}</td>
                                <td className="px-3 py-2 text-slate-600">{r.date}</td>
                                <td className="px-3 py-2 text-slate-600">{r.original_start ?? r.start_time} - {r.original_end ?? r.end_time}</td>
                                <td className="px-3 py-2 text-slate-600">{r.room}</td>
                                {type === "invalid" && <td className="px-3 py-2 text-red-600 font-medium">{r.error}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex justify-between items-start p-6 pb-4 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Import Lịch học</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Upload file Excel/CSV theo Template mẫu.
                            <a href="/schedule_template.xlsx" download className="text-blue-600 hover:underline font-medium ml-1">Tải xuống file mẫu</a>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 pt-2 flex-1 overflow-y-auto">
                    {/* Drag & Drop Area */}
                    {!previewData && (
                        <div 
                            className={`flex justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
                                dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
                            }`}
                            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                        >
                            <div className="text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-slate-300" />
                                <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                                    <label className="relative cursor-pointer rounded-md font-semibold text-blue-600 hover:text-blue-500">
                                        <span>Upload a file</span>
                                        <input type="file" className="sr-only" accept=".xls, .xlsx, .csv" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Excel hoặc CSV (.xlsx, .csv)</p>
                            </div>
                        </div>
                    )}

                    {/* Preview Section */}
                    {previewData && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                <span className="text-sm text-slate-600">Tổng quan: <b>{previewData.total} dòng đọc được</b></span>
                                <button onClick={() => { setPreviewData(null); setFile(null); }} className="text-xs text-blue-600 font-medium hover:underline">
                                    Tải tệp khác
                                </button>
                            </div>

                            {/* Tabs Header */}
                            <div className="flex gap-2 border-b border-slate-200">
                                <button 
                                    onClick={() => setActiveTab("valid")}
                                    className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                                        activeTab === "valid" ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <CheckCircle size={16} /> Hợp lệ ({previewData.valid_count})
                                </button>
                                <button 
                                    onClick={() => setActiveTab("invalid")}
                                    className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                                        activeTab === "invalid" ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <AlertCircle size={16} /> Lỗi ({previewData.invalid_count})
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="max-h-[350px] overflow-y-auto">
                                {activeTab === "valid" ? renderTable(previewData.validRows, "valid") : renderTable(previewData.invalidRows, "invalid")}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 flex justify-end gap-3 shrink-0 border-t border-slate-100">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                        Thoát
                    </button>
                    {previewData && (
                        <button
                            onClick={handleConfirmImport}
                            disabled={loading || previewData.valid_count === 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            Xác nhận Import ({previewData.valid_count} dòng)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
