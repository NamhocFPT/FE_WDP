// src/component/pages/teacher/TeacherClassList.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Badge } from "component/ui";

export default function TeacherClassList() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const token = localStorage.getItem("smartedu_token");
                const res = await fetch("http://localhost:9999/api/teacher/my-classes", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) setClasses(data.data);
            } catch (err) {
                console.error("Lỗi lấy danh sách lớp:", err);
            } finally { setLoading(false); }
        };
        fetchClasses();
    }, []);

    return (
        <div className="space-y-4">
            <PageHeader title="Lớp học của tôi" subtitle="Chọn một lớp để quản lý bài tập và sinh viên." />
            
            {loading ? (
                <p className="text-center p-10 text-slate-500">Đang tải danh sách lớp...</p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {classes.map((c) => (
                        <Card key={c.id} className="hover:shadow-lg transition-all border-t-4 border-t-blue-600">
                            <CardContent className="p-6">
                                <div className="mb-3">
                                    <Badge tone="blue">{c.course?.code || "course"}</Badge>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{c.name}</h3>
                                <p className="text-sm text-slate-600 mb-5">
                                    Học kỳ: <span className="font-semibold">{c.semester}</span> <br/>
                                    Bắt đầu: {new Date(c.start_date).toLocaleDateString('vi-VN')}
                                </p>
                                <div className="flex gap-2">
                                    <Button 
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => navigate(`/teacher/classes/${c.id}/assignments?type=essay`)}
                                    >
                                        Tự luận
                                    </Button>
                                    <Button 
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => navigate(`/teacher/classes/${c.id}/assignments?type=quiz`)}
                                    >
                                        Trắc nghiệm
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                                        onClick={() => navigate(`/teacher/classes/${c.id}/gradebook`)}
                                    >
                                        Bảng điểm
                                    </Button>
                                </div>

                            </CardContent>
                        </Card>
                    ))}
                    {classes.length === 0 && (
                        <div className="col-span-full text-center p-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                            Bạn chưa được phân công dạy lớp nào trong học kỳ này.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}