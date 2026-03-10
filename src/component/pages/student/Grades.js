// src/component/pages/student/Grades.js
import React from "react";
import { PageHeader, Card, CardContent } from "component/ui";

export default function Grades() {
    return (
        <div className="space-y-6">
            <PageHeader title="My Grades" subtitle="Your academic performance overview." />

            <Card className="border-dashed border-2 border-slate-200">
                <CardContent className="p-16 text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Grade Book is updating</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        We are currently syncing grades from your instructors. Please check back later to view your detailed scores and feedback for this semester.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}