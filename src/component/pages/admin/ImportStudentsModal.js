import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, UploadCloud, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "service/adminApi";
import * as XLSX from "xlsx";

export default function ImportStudentsModal({ isOpen, onClose, classId, onSuccess }) {
    const [file, setFile] = useState(null);
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    if (!isOpen) return null;

    const parseEmailsFromFile = (uploadedFile) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                let content = "";
                const fileName = uploadedFile.name.toLowerCase();

                if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
                    // Parse Excel
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    // Ghép nội dung tất cả các sheet lại thành 1 chuỗi text lớn
                    workbook.SheetNames.forEach(sheetName => {
                        const sheet = workbook.Sheets[sheetName];
                        content += XLSX.utils.sheet_to_txt(sheet) + " ";
                    });
                } else {
                    // Parse Text / CSV
                    content = e.target.result;
                }

                // Biểu thức chính quy trích xuất tất cả các email hợp lệ trong string content
                const matchedEmails = content.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || [];
                // Loại bỏ email trùng lặp nếu có
                const uniqueEmails = [...new Set(matchedEmails)];
                
                if (uniqueEmails.length === 0) {
                    toast.error("Không tìm thấy địa chỉ email hợp lệ nào trong file này.");
                    setFile(null);
                    setEmails([]);
                } else {
                    setFile(uploadedFile);
                    setEmails(uniqueEmails);
                    toast.success(`Tìm thấy ${uniqueEmails.length} email hợp lệ.`);
                }
            } catch (error) {
                console.error("Parse file error:", error);
                toast.error("File không đúng định dạng hoặc bị lỗi.");
                setFile(null);
                setEmails([]);
            }
        };

        reader.onerror = () => {
            toast.error("Không thể đọc được file.");
            setFile(null);
            setEmails([]);
        }

        const fileName = uploadedFile.name.toLowerCase();
        if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
            reader.readAsArrayBuffer(uploadedFile); // Đọc Binary file Excel
        } else {
            reader.readAsText(uploadedFile); // Đọc nội dung Text (.csv, .txt)
        }
    };

    const handleFileChange = (e) => {
        const targetFile = e.target.files[0];
        if (targetFile) parseEmailsFromFile(targetFile);
    };

    // Hàm hỗ trợ Kéo & Thả file (Drag and Drop)
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            parseEmailsFromFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (emails.length === 0) {
            toast.error("Vui lòng upload file chứa email hợp lệ.");
            return;
        }

        setLoading(true);
        try {
            const res = await adminApi.importStudents(classId, emails);
            toast.success(res.data.message || "Import thành công!");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi import");
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start p-6 pb-4 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Import Students</h3>
                        <p className="text-sm text-slate-500 mt-1">Upload a CSV or TXT file containing student emails</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 pt-2">
                    {/* Khu vực Upload Drag & Drop */}
                    <div 
                        className={`mt-2 flex justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
                            dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
                        } ${file ? 'bg-slate-50' : 'bg-white'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="text-center">
                            {file ? (
                                <FileText className="mx-auto h-12 w-12 text-blue-500" />
                            ) : (
                                <UploadCloud className="mx-auto h-12 w-12 text-slate-300" />
                            )}
                            <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                                {file ? (
                                    <span className="font-semibold text-slate-900">{file.name}</span>
                                ) : (
                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none hover:text-blue-500">
                                        <span>Upload a file</span>
                                        <input 
                                            id="file-upload" 
                                            name="file-upload" 
                                            type="file" 
                                            className="sr-only" 
                                            accept=".csv, .txt, .xls, .xlsx"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                )}
                                {!file && <p className="pl-1">or drag and drop</p>}
                            </div>
                            <p className="text-xs leading-5 text-slate-500 mt-1">
                                {file ? `Found ${emails.length} unique valid emails` : "Excel, CSV or TXT files only"}
                            </p>
                            
                            {file && (
                                <button 
                                    onClick={() => { setFile(null); setEmails([]); }}
                                    className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium"
                                >
                                    Select different file
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-700">How it works:</span> Thả file Excel, CSV hoặc TXT chứa danh sách học viên. Hệ thống sẽ tự động tìm kiếm (quét) mọi thông tin có định dạng là email nằm trong tất cả các ô trên file đó để import.
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 flex justify-end gap-3 shrink-0 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || emails.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        Import {emails.length > 0 ? `${emails.length} Users` : ""}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
