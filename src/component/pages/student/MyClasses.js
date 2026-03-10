// src/component/pages/student/MyClasses.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Badge } from "component/ui";

export default function MyClasses() {
    const nav = useNavigate();
    const [classes, setClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const token = localStorage.getItem("smartedu_token");
                const res = await fetch("http://localhost:9999/api/students/classes", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) setClasses(result.data);
            } catch (error) {
                console.error("Lỗi lấy danh sách lớp:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClasses();
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader title="My Classes" subtitle="Classes you are enrolled in." />

            {isLoading ? (
                <div className="text-center p-10 text-slate-500">Đang tải danh sách lớp...</div>
            ) : classes.length === 0 ? (
                <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                    You have not been enrolled in any classes for this semester.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {classes.map((c) => (
                        <Card key={c.id} className="hover:shadow-md transition-shadow border-t-4 border-t-blue-500">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="text-lg font-bold text-slate-900">{c.name}</div>
                                        <div className="mt-1 text-sm text-slate-600">Teacher: {c.teacher}</div>
                                    </div>
                                    <Badge tone="blue">Room {c.room}</Badge>
                                </div>

                                <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    {c.schedule.length > 0 
                                        ? c.schedule.map((s) => `${s.day} ${s.time}`).join(" • ")
                                        : "Chưa có lịch học"}
                                </div>

                                <div className="mt-5">
                                    <Button className="w-full bg-slate-800 text-white hover:bg-slate-900" onClick={() => nav(`/student/classes/${c.id}`)}>
                                        Vào lớp học
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}