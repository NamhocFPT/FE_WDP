// src/component/pages/admin/UserManagement.js
import React, { useMemo, useState } from "react";
import { mock } from "service/mockData";
import { PageHeader, Card, CardContent, Input, Button, Badge, Table, Th, Td, Modal } from "component/ui";

export default function UserManagement() {
    const [q, setQ] = useState("");
    const [role, setRole] = useState("all");
    const [open, setOpen] = useState(false);

    const rows = useMemo(() => {
        return mock.users.filter((u) => {
            const okQ =
                !q ||
                u.name.toLowerCase().includes(q.toLowerCase()) ||
                u.email.toLowerCase().includes(q.toLowerCase());
            const okRole = role === "all" || u.role === role;
            return okQ && okRole;
        });
    }, [q, role]);

    return (
        <div>
            <PageHeader
                title="User Management"
                subtitle="Search, filter and manage user accounts."
                right={[
                    <Button key="add" onClick={() => setOpen(true)}>Add User</Button>,
                ]}
            />

            <Card>
                <CardContent>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex-1">
                            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email..." />
                        </div>
                        <select
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="all">All roles</option>
                            <option value="admin">Admin</option>
                            <option value="teacher">Teacher</option>
                            <option value="student">Student</option>
                        </select>
                    </div>

                    <div className="mt-3 overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Name</Th>
                                    <Th>Email</Th>
                                    <Th>Role</Th>
                                    <Th>Status</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((u) => (
                                    <tr key={u.id}>
                                        <Td className="font-semibold text-slate-900">{u.name}</Td>
                                        <Td>{u.email}</Td>
                                        <Td><Badge tone="blue">{u.role}</Badge></Td>
                                        <Td><Badge tone={u.status === "active" ? "green" : "amber"}>{u.status}</Badge></Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Modal open={open} title="Add User (demo)" onClose={() => setOpen(false)}>
                <div className="grid gap-3">
                    <div className="text-sm text-slate-600">Màn demo UI. Bạn có thể nối API sau.</div>
                    <Button onClick={() => setOpen(false)}>Done</Button>
                </div>
            </Modal>
        </div>
    );
}