// src/component/pages/admin/ClassManagement.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { mock } from "service/mockData";
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge } from "component/ui";

export default function ClassManagement() {
    const nav = useNavigate();

    return (
        <div>
            <PageHeader title="Class Management" subtitle="View and manage classes." right={[<Button key="add">Create Class</Button>]} />

            <Card>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Class</Th>
                                    <Th>Teacher</Th>
                                    <Th>Room</Th>
                                    <Th>Schedule</Th>
                                    <Th></Th>
                                </tr>
                            </thead>
                            <tbody>
                                {mock.classes.map((cl) => (
                                    <tr key={cl.id}>
                                        <Td className="font-semibold text-slate-900">{cl.name}</Td>
                                        <Td>{cl.teacher}</Td>
                                        <Td><Badge tone="slate">{cl.room}</Badge></Td>
                                        <Td className="text-xs text-slate-600">
                                            {cl.schedule.map((s) => `${s.day} ${s.time}`).join(" • ")}
                                        </Td>
                                        <Td>
                                            <Button variant="outline" onClick={() => nav(`/admin/classes/${cl.id}`)}>
                                                View
                                            </Button>
                                        </Td>
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