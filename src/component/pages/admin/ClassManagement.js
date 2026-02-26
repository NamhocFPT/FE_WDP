// src/component/pages/admin/ClassManagement.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "service/adminApi"; 
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge } from "component/ui";
import { ChevronRight, Search, Pencil, Users } from "lucide-react";
// Import Component Modal mới tạo ở Bước 2
import CreateClassModal from "./CreateClassModal"; 

export default function ClassManagement() {
    const nav = useNavigate();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState(""); 
    const [isModalOpen, setIsModalOpen] = useState(false); // Quản lý đóng/mở Popup

    const fetchClasses = async () => {
        try {
            const res = await adminApi.getClasses();
            const activeClasses = res.data.data.filter(cl => !cl.is_deleted);
            setClasses(activeClasses); 
            setLoading(false);
        } catch (err) {
            console.error("Error fetching classes:", err);
            setLoading(false);
        }
    };

    useEffect(() => { fetchClasses(); }, []);

    const filteredClasses = useMemo(() => {
        return classes.filter((cl) => 
            !q || 
            cl.name?.toLowerCase().includes(q.toLowerCase()) || 
            cl.course?.name?.toLowerCase().includes(q.toLowerCase())
        );
    }, [q, classes]);

    if (loading) return <div className="p-8 text-center text-slate-500 italic">Loading classes...</div>;

    return (
        <div className="flex flex-col h-full w-full bg-[#f8fafc] p-8 space-y-6">
            <PageHeader 
                title="Class Management" 
                subtitle="View and manage real-time classes." 
                right={[
                    <Button 
                        key="add" 
                        className="bg-[#0f172a] text-white px-5" 
                        onClick={() => setIsModalOpen(true)} // ĐỔI TỪ nav SANG setIsModalOpen
                    >
                        Create Class
                    </Button>
                ]} 
            />

            {/* Thanh Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 relative shadow-sm">
                <Search className="absolute left-7 top-7 text-slate-400" size={18} />
                <input 
                    type="text" 
                    value={q} 
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by class code or name..." 
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                />
            </div>

            {/* Bảng dữ liệu */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <Th className="py-5 px-6">Class</Th>
                                    <Th>Course</Th>
                                    <Th>Semester</Th>
                                    <Th>Teacher</Th>
                                    <Th>Enrollment</Th>
                                    <Th>Status</Th>
                                    <Th className="text-center">Actions</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredClasses.map((cl) => (
                                    <tr key={cl.id} className="hover:bg-slate-50 transition-colors">
                                        <Td className="py-5 px-6 font-bold">{cl.name}</Td>
                                        <Td>{cl.course?.name || "N/A"}</Td>
                                        <Td className="italic">{cl.semester || "Spring 2026"}</Td>
                                        <Td>{cl.teacher?.full_name || "Unassigned"}</Td>
                                        <Td>
                                            <div className="flex items-center gap-2">
                                                <Users size={14} />
                                                <span className="font-semibold">{cl.enrollments?.length || 0}</span> / {cl.max_capacity || 40}
                                            </div>
                                        </Td>
                                        <Td>
                                            <Badge tone={cl.status === "active" ? "green" : "closed"}>
                                                {cl.status || "active"}
                                            </Badge>
                                        </Td>
                                        <Td className="flex justify-center gap-4 py-5">
                                            <button onClick={() => nav(`/admin/classes/${cl.id}`)}>
                                                <ChevronRight size={18} className="text-blue-600" />
                                            </button>
                                            <Pencil size={16} className="text-slate-400" />
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* TÍCH HỢP POPUP TẠI ĐÂY */}
            {isModalOpen && (
                <CreateClassModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchClasses(); // Tải lại danh sách sau khi tạo
                    }}
                />
            )}
        </div>
    );
}