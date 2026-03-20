import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Badge } from "component/ui";
import { studentApi } from "service/studentApi";
import { BookOpen, GraduationCap, ChevronRight, BarChart3 } from "lucide-react";

export default function Grades() {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const res = await studentApi.getGradesOverview();
                const result = res.data;
                if (result.status === "success" || result.success) {
                    setGrades(result.data || []);
                }
            } catch (err) {
                console.error("Lỗi lấy tổng quan điểm:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOverview();
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Bảng điểm tổng quát" 
                subtitle="Theo dõi tiến độ học tập và điểm trung bình tích lũy của tất cả các môn." 
            />

            <div className="grid gap-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium italic">Đang tải bảng điểm tổng hợp...</p>
                    </div>
                ) : grades.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {grades.map((g) => (
                            <Card key={g.class_id} className="group hover:shadow-xl transition-all duration-300 border-none shadow-sm ring-1 ring-slate-200">
                                <CardContent className="p-0">
                                    <div className="p-5 border-b border-slate-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                            <Badge tone={g.course_total >= 5 ? "green" : g.course_total === null ? "slate" : "amber"}>
                                                {g.course_total !== null ? `TB: ${Number(g.course_total).toFixed(2)}` : "Chưa có điểm"}
                                            </Badge>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg line-clamp-1 mb-1">{g.class_name}</h3>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <GraduationCap className="h-4 w-4" /> GV: {g.teacher}
                                        </p>
                                    </div>
                                    
                                    <div className="p-5 bg-slate-50/50 space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 flex items-center gap-1.5"><BarChart3 className="h-4 w-4" /> Tiến độ công bố:</span>
                                            <span className="font-bold text-slate-700">{g.published_count} / {g.total_assessments}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-blue-500 h-full transition-all duration-1000" 
                                                style={{ width: `${(g.published_count / g.total_assessments) * 100}%` }}
                                            ></div>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            className="w-full mt-2 group/btn border-slate-300 hover:border-blue-600 hover:text-blue-600 transition-all font-bold"
                                            onClick={() => navigate(`/student/classes/${g.class_id}/grades`)}
                                        >
                                            Xem chi tiết <ChevronRight className="ml-1 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Chưa có dữ liệu điểm</h3>
                        <p className="text-slate-500">Bạn hiện chưa tham gia lớp học nào hoặc chưa có bài tập nào được công bố điểm.</p>
                    </div>
                )}
            </div>
        </div>
    );
}