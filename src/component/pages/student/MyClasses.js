// src/component/pages/student/MyClasses.js
import React, { useState, useEffect }, { useState, useEffect } from "react";
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
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await studentApi.getMyClasses();
                if (res.data?.success) {
                    setClasses(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch classes:", err);
                setError("Could not load your classes.");
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    if (loading) return <div className="p-4">Loading classes...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <PageHeader title="My Classes" subtitle="Classes you are enrolled in." />

            {/* Xử lý trạng thái Loading và Error */}
            {isLoading ? (
                <div className="text-center p-10 text-slate-500 animate-pulse">
                    Đang tải danh sách lớp...
                </div>
            ) : error ? (
                <div className="text-center p-10 bg-red-50 border-2 border-dashed border-red-200 rounded-xl text-red-500 font-medium">
                    {error}
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
                                            Teacher: <span className="font-medium text-slate-800">{c.teacher || "Chưa phân công"}</span>
                                        </div>
                                    </div>
                                    <Badge tone="blue" className="shrink-0 whitespace-nowrap">
                                        Room {c.room || "N/A"}
                                    </Badge>
                                </div>

                                {/* Lịch học */}
                                <div className="mt-auto mb-5 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2">
                                    <span className="text-lg">⏰</span>
                                    <span>
                                        {c.schedule && c.schedule.length > 0
                                            ? c.schedule.map((s) => `${s.day} ${s.time}`).join(" • ")
                                            : "Chưa có lịch học cụ thể"}
                                    </span>
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