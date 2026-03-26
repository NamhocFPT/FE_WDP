import React, { useState, useEffect } from "react";
import { Modal, Button, Badge } from "component/ui";
import { Share2, Check, Loader2 } from "lucide-react";

export default function ShareAssessmentModal({ open, onClose, assessment, currentClassId }) {
    const [classes, setClasses] = useState([]);
    const [sharedClassIds, setSharedClassIds] = useState([]);
    const [selectedClassIds, setSelectedClassIds] = useState([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [results, setResults] = useState(null);

    useEffect(() => {
        if (open && assessment) {
            fetchClasses();
            fetchShareStatus();
            setResults(null);
            setSelectedClassIds([]);
        }
    }, [open, assessment, currentClassId]);

    const fetchClasses = async () => {
        setIsFetching(true);
        try {
            const token = localStorage.getItem("smartedu_token");
            const response = await fetch("http://localhost:9999/api/teacher/my-classes", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                // Lọc bỏ lớp hiện tại
                setClasses(data.data.filter(c => String(c.id) !== String(currentClassId)));
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách lớp:", error);
        } finally {
            setIsFetching(false);
        }
    };

    const fetchShareStatus = async () => {
        if (!assessment) return;
        try {
            const token = localStorage.getItem("smartedu_token");
            const response = await fetch(`http://localhost:9999/api/teacher/assessments/${assessment.id}/share-status`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSharedClassIds(data.data);
            }
        } catch (error) {
            console.error("Lỗi lấy trạng thái chia sẻ:", error);
        }
    };

    const handleToggleClass = (classId) => {
        setSelectedClassIds(prev => 
            prev.includes(classId) 
                ? prev.filter(id => id !== classId) 
                : [...prev, classId]
        );
    };

    const handleShare = async () => {
        if (selectedClassIds.length === 0) return;
        setIsSharing(true);
        try {
            const token = localStorage.getItem("smartedu_token");
            const response = await fetch(`http://localhost:9999/api/teacher/assessments/${assessment.id}/share`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ targetClassIds: selectedClassIds })
            });
            const data = await response.json();
            if (data.success) {
                setResults(data.data);
            } else {
                alert(data.message || "Lỗi khi chia sẻ.");
            }
        } catch (error) {
            console.error("Lỗi chia sẻ:", error);
            alert("Lỗi kết nối.");
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <Modal open={open} onClose={isSharing ? null : onClose} title="Chia sẻ bài tập sang lớp khác">
            <div className="space-y-4 min-w-[320px]">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Bài tập đang chọn</div>
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-blue-500" />
                        {assessment?.title}
                    </div>
                </div>

                {!results ? (
                    <>
                        <div className="text-sm font-semibold text-slate-700">Chọn các lớp học để chia sẻ:</div>
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {isFetching ? (
                                <div className="py-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang tải danh sách lớp...
                                </div>
                            ) : classes.length > 0 ? (
                                classes.map(c => {
                                    const isAlreadyShared = sharedClassIds.includes(c.id);
                                    const isUpcoming = c.status === 'upcoming';
                                    const isDisabled = isAlreadyShared || isUpcoming;
                                    return (
                                        <div 
                                            key={c.id} 
                                            onClick={() => !isDisabled && handleToggleClass(c.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all 
                                                ${isDisabled ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed' : 
                                                  selectedClassIds.includes(c.id) 
                                                    ? 'border-blue-500 bg-blue-50 shadow-sm cursor-pointer' 
                                                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 cursor-pointer'}`}
                                            title={isAlreadyShared ? "Đã được chia sẻ tới lớp này" : isUpcoming ? "Lớp học chưa bắt đầu" : ""}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-slate-900 truncate">{c.name}</div>
                                                <div className="text-[11px] text-slate-500 truncate">{c.course?.name || "No Course"}</div>
                                            </div>
                                            {isAlreadyShared ? (
                                                <Badge tone="blue">Đã chia sẻ</Badge>
                                            ) : isUpcoming ? (
                                                <Badge tone="indigo">Lớp chưa mở</Badge>
                                            ) : selectedClassIds.includes(c.id) && (
                                                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 ml-2">
                                                    <Check className="w-3 h-3" strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-10 text-center text-slate-400 text-sm">Bạn không có lớp học nào khác để chia sẻ.</div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSharing}>Hủy</Button>
                            <Button 
                                className="flex-1 gap-2" 
                                onClick={handleShare} 
                                disabled={isSharing || selectedClassIds.length === 0}
                            >
                                {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                                Chia sẻ ({selectedClassIds.length})
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4 py-2">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 animate-in zoom-in duration-300">
                                <Check className="w-6 h-6" strokeWidth={3} />
                            </div>
                            <h3 className="font-bold text-slate-900">Hoàn tất chia sẻ</h3>
                            <p className="text-[13px] text-slate-500">Bài tập đã được sao chép dưới dạng bản nháp:</p>
                        </div>
                        
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {results.map(r => (
                                <div key={r.classId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-sm border border-slate-100">
                                    <span className="font-semibold text-slate-700 truncate mr-2">{r.className || r.classId}</span>
                                    {r.success ? (
                                        <Badge tone="green">Xong</Badge>
                                    ) : (
                                        <Badge tone="red">Lỗi</Badge>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button className="w-full" onClick={onClose}>Đóng</Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
