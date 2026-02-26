// src/component/pages/teacher/AssignmentManagement.js
import React from "react";
import { mock } from "service/mockData";
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge } from "component/ui";

export default function AssignmentManagement() {
    const cls = mock.classes[0];

    return (
        <div>
            <PageHeader title="Assignments" subtitle="Create and track assignments." right={[<Button key="new">New Assignment</Button>]} />

            <Card>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Title</Th>
                                    <Th>Due</Th>
                                    <Th>Points</Th>
                                    <Th>Status</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {cls.assignments.map((a) => (
                                    <tr key={a.id}>
                                        <Td className="font-semibold text-slate-900">{a.title}</Td>
                                        <Td>{a.due}</Td>
                                        <Td><Badge tone="amber">{a.points}</Badge></Td>
                                        <Td><Badge tone="green">Published</Badge></Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}