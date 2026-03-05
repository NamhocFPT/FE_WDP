// src/component/pages/student/MyClasses.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "service/studentApi";
import { PageHeader, Card, CardContent, Button, Badge } from "component/ui";

export default function MyClasses() {
    const nav = useNavigate();
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
        <div>
            <PageHeader title="My Classes" subtitle="Classes you are enrolled in." />

            <div className="grid gap-3 md:grid-cols-2">
                {classes.length === 0 ? (
                    <div className="text-slate-500 col-span-2">Bạn chưa tham gia lớp học nào.</div>
                ) : (
                    classes.map((c) => (
                        <Card key={c.id}>
                            <CardContent>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                                        <div className="mt-1 text-xs text-slate-500">Teacher: {c.teacher}</div>
                                    </div>
                                    <Badge tone="blue">{c.room}</Badge>
                                </div>

                                <div className="mt-3 text-xs text-slate-600">
                                    {c.schedule && c.schedule.length > 0
                                        ? c.schedule.map((s) => `${s.day} ${s.time}`).join(" • ")
                                        : "Chưa có lịch học"}
                                </div>

                                <div className="mt-3">
                                    <Button variant="outline" onClick={() => nav(`/student/classes/${c.id}`)}>
                                        Open class
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}