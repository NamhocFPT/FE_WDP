import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "service/adminApi";

export default function AddStudentModal({ isOpen, onClose, classId, enrolledStudentIds = [], onSuccess }) {
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setFetching(true);
        // Reset state
        setSearchQuery("");
        setSelectedIds([]);
        
        adminApi.getStudents()
            .then(res => {
                // Filter out students that are already enrolled
                const available = (res.data.data || []).filter(student => !enrolledStudentIds.includes(student.id));
                setStudents(available);
            })
            .catch(err => {
                console.error("Error fetching students:", err);
                toast.error("Failed to load students.");
            })
            .finally(() => setFetching(false));
    }, [isOpen, enrolledStudentIds]);

    if (!isOpen) return null;

    const filteredStudents = students.filter(student => {
        const query = searchQuery.toLowerCase();
        return (
            (student.full_name && student.full_name.toLowerCase().includes(query)) ||
            (student.email && student.email.toLowerCase().includes(query)) ||
            (student.id && student.id.toLowerCase().includes(query))
        );
    });

    const toggleStudentSelection = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedIds.length === 0) {
            toast.error("Please select at least one student.");
            return;
        }

        setLoading(true);
        try {
            await adminApi.enrollStudents(classId, selectedIds);
            toast.success("Students enrolled successfully!");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-start p-6 pb-4 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Add Students</h3>
                        <p className="text-sm text-slate-500 mt-1">Search and select students to enroll in this class</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 pb-2 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or student ID"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 outline-none border-t border-b border-slate-100 mt-2">
                    {fetching ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="animate-spin mb-2" size={24} />
                            <p className="text-sm">Loading students...</p>
                        </div>
                    ) : filteredStudents.length > 0 ? (
                        <div className="space-y-1">
                            {filteredStudents.map(student => (
                                <label 
                                    key={student.id} 
                                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                                >
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedIds.includes(student.id)}
                                        onChange={() => toggleStudentSelection(student.id)}
                                    />
                                    <div>
                                        <div className="font-bold text-slate-900">{student.full_name || "Unknown"}</div>
                                        <div className="text-xs text-slate-500">{student.email}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            {searchQuery ? "No students matching your search criteria." : "All active students are already enrolled in this class."}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 flex justify-end gap-3 shrink-0">
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
                        disabled={loading || selectedIds.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        Add Selected
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
