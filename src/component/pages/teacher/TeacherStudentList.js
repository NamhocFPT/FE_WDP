import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Table, Th, Td, Badge, Input } from "component/ui";

export default function TeacherStudentList() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchStudents = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("smartedu_token");
                const res = await fetch(`http://localhost:9999/api/teacher/classes/${classId}/students`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) {
                    setStudents(result.data);
                }
            } catch (error) {
                console.error("Lỗi lấy danh sách học sinh:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (classId) fetchStudents();
    }, [classId]);

    const filteredStudents = students.filter(s => 
        s.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <PageHeader title="Danh sách học sinh" />

            <Card>
                <CardContent className="p-4 flex justify-between items-center bg-slate-50 rounded-t-xl border-b">
                    <div className="text-sm font-bold text-slate-700">Tổng số: {students.length} học sinh</div>
                    <Input 
                        placeholder="Tìm tên hoặc email..." 
                        className="max-w-xs bg-white" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </CardContent>
                <CardContent className="p-0">
                    <Table>
                        <thead>
                            <tr>
                                <Th>STT</Th>
                                <Th>Học sinh</Th>
                                <Th>Email</Th>
                                <Th>Trạng thái</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><Td colSpan="4" className="text-center py-10 text-slate-500">Đang tải dữ liệu...</Td></tr>
                            ) : filteredStudents.length > 0 ? filteredStudents.map((s, index) => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                    <Td className="font-bold text-slate-400">{index + 1}</Td>
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-600">
                                                {s.student?.full_name?.charAt(0) || "U"}
                                            </div>
                                            <p className="font-bold text-sm text-slate-900">{s.student?.full_name || "Unknown User"}</p>
                                        </div>
                                    </Td>
                                    <Td className="text-sm text-slate-600">{s.student?.email || "-"}</Td>
                                    <Td>
                                        <Badge tone={s.status === 'active' ? 'green' : 'red'}>
                                            {s.status === 'active' ? 'Đang học' : 'Rút lớp'}
                                        </Badge>
                                    </Td>
                                </tr>
                            )) : (
                                <tr><Td colSpan="4" className="text-center py-10 text-slate-400">Không tìm thấy học sinh nào.</Td></tr>
                            )}
                        </tbody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
