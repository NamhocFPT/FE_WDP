// src/component/pages/student/MyClasses.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "service/studentApi";
import { PageHeader, Card, CardContent, Button, Badge } from "component/ui";

export default function MyClasses() {
    const nav = useNavigate();
    const [classes, setClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoading(true);
            try {
                // Sử dụng studentApi để gọi data (Chuẩn cấu trúc project)
                const res = await studentApi.getMyClasses();
                if (res.data?.success) {
                    setClasses(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch classes:", err);
                setError("Could not load your classes.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchClasses();
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader title="Lớp học của tôi" subtitle="Danh sách các lớp học bạn đang tham gia." />

            {/* Xử lý trạng thái Loading và Error */}
            {isLoading ? (
                <div className="text-center p-10 text-slate-500 animate-pulse">
                    Đang tải danh sách lớp...
                </div>
            ) : error ? (
                <div className="text-center p-10 bg-red-50 border-2 border-dashed border-red-200 rounded-xl text-red-500 font-medium">
                    {error === "Could not load your classes." ? "Không thể tải danh sách lớp học." : error}
                </div>
            ) : classes.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl text-slate-500">
                    <div className="text-4xl mb-3">🎓</div>
                    Bạn chưa tham gia lớp học nào trong học kỳ này.
                </div>
            ) : (
                /* Grid giao diện thẻ lớp học xịn xò */
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {classes.map((c) => (
                        <Card key={c.id} className="hover:shadow-md transition-shadow border-t-4 border-t-blue-500">
                            <CardContent className="p-5 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="text-lg font-bold text-slate-900 line-clamp-1" title={c.name}>
                                            {c.name}
                                        </div>
                                        <div className="mt-1 text-sm text-slate-600">
                                            Giáo viên: <span className="font-medium text-slate-800">{c.teacher || "Chưa phân công"}</span>
                                        </div>
                                    </div>
                                    <Badge tone="blue" className="shrink-0 whitespace-nowrap">
                                        Phòng {c.room || "TBA"}
                                    </Badge>
                                </div>

                                {/* Lịch học */}
                                <div className="mt-auto mb-5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                                        <span className="text-base">⏰</span> Lịch học
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        {c.schedule && c.schedule.length > 0 ? (
                                            (() => {
                                                const uniqueSchedule = Array.from(new Set(c.schedule.map((s) => `${s.day} ${s.time} • P.${s.room}`)));
                                                const displayCount = 3;
                                                const displayItems = uniqueSchedule.slice(0, displayCount);
                                                const remainingCount = uniqueSchedule.length - displayItems.length;
                                                
                                                return (
                                                    <>
                                                        {displayItems.map((timeStr, idx) => (
                                                            <div key={idx} className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md text-[10px] font-black shadow-sm flex items-center gap-1 border-l-2 border-l-blue-400 whitespace-nowrap">
                                                                {timeStr}
                                                            </div>
                                                        ))}
                                                        {remainingCount > 0 && (
                                                            <span className="text-[10px] font-black text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                                +{remainingCount}
                                                            </span>
                                                        )}
                                                    </>
                                                );
                                            })()
                                        ) : (
                                            <span className="text-slate-400 italic text-[10px]">Chưa sắp lịch</span>
                                        )}
                                    </div>
                                </div>

                                {/* Nút Action */}
                                <Button
                                    className="w-full bg-slate-800 text-white hover:bg-slate-900 transition-colors"
                                    onClick={() => nav(`/student/classes/${c.id}`)}
                                >
                                    Vào lớp học
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}