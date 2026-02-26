// src/component/pages/teacher/MaterialsManagement.js
import React from "react";
import { mock } from "service/mockData";
import { PageHeader, Card, CardContent, Button, Badge } from "component/ui";

export default function MaterialsManagement() {
    const cls = mock.classes[0];

    return (
        <div>
            <PageHeader title="Materials" subtitle="Upload and manage learning materials." right={[<Button key="up">Upload</Button>]} />

            <Card>
                <CardContent className="space-y-2">
                    {cls.materials.map((m) => (
                        <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                            <div>
                                <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                                <div className="text-xs text-slate-500">Updated: {m.updatedAt}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge tone="blue">{m.type}</Badge>
                                <Button variant="outline">Edit</Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}