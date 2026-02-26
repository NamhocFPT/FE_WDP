// src/component/pages/teacher/QuizCreation.js
import React, { useState } from "react";
import { PageHeader, Card, CardContent, Input, Button, Badge } from "component/ui";

export default function QuizCreation() {
    const [title, setTitle] = useState("Quiz 01 - Basics");
    const [duration, setDuration] = useState(20);
    const [msg, setMsg] = useState("");

    const onSave = () => {
        setMsg("Saved (demo).");
        setTimeout(() => setMsg(""), 1200);
    };

    return (
        <div>
            <PageHeader title="Quiz Creation" subtitle="Build quizzes for your class." right={[<Button key="save" onClick={onSave}>Save</Button>]} />

            <Card>
                <CardContent className="grid gap-4 lg:grid-cols-2">
                    <div>
                        <div className="mb-1 text-xs font-semibold text-slate-600">Quiz title</div>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div>
                        <div className="mb-1 text-xs font-semibold text-slate-600">Duration (minutes)</div>
                        <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value || 0))} />
                    </div>

                    <div className="lg:col-span-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            Demo UI: Bạn có thể thêm Question builder ở đây (MCQ, True/False, Short answer…).
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <Badge tone="blue">Draft</Badge>
                            {msg ? <span className="text-sm font-semibold text-emerald-600">{msg}</span> : null}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}