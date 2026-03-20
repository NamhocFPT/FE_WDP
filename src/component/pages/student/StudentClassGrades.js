import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, CardContent, Button, Table, Th, Td, Badge } from "component/ui";
import { studentApi } from "service/studentApi";
import { ChevronLeft, Lock, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";

export default function StudentClassGrades() {
    const { classId } = useParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const res = await studentApi.getClassGrades(classId);
                const result = res.data;
                if (result.status === "success" || result.success) {
                    setData(result.data);
                }
            } catch (err) {
                console.error("Lỗi lấy chi tiết điểm lớp:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, [classId]);

    const getStatusBadge = (status) => {
        switch (status) {
            case "published":
                return <Badge tone="green" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Đã công bố</Badge>;
            case "hidden":
                return <Badge tone="slate" className="gap-1 opacity-70"><Lock className="h-3 w-3" /> Chờ công bố</Badge>;
            case "submitted":
                return <Badge tone="blue" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Đã nộp bài</Badge>;
            case "no_submission":
                return <Badge tone="amber" className="gap-1"><AlertCircle className="h-3 w-3" /> Chưa nộp bài</Badge>;
            default:
                return <Badge tone="slate">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20">
                <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-medium">Đang truy vấn bảng điểm...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-10 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Không tìm thấy dữ liệu</h2>
                <Button className="mt-4" onClick={() => navigate(-1)}>Quay lại</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title={`Bảng điểm: ${data.class.name}`} 
                subtitle={`Giảng viên: ${data.class.teacher}`}
                right={[
                    <Button key="back" variant="outline" onClick={() => navigate(-1)}>
                        <ChevronLeft className="mr-1 h-4 w-4" /> Quay lại
                    </Button>
                ]}
            />

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Summary Section */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg">
                        <CardContent className="p-6 text-center">
                            <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-2">Điểm tổng kết hiện tại</p>
                            <div className="text-5xl font-black mb-1">
                                {data.course_total !== null ? Number(data.course_total).toFixed(2) : "--"}
                            </div>
                            <p className="text-blue-100 text-xs">Dựa trên {data.grade_items.filter(i => i.status === 'published').length} hạng mục đã công bố</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200">
                        <CardContent className="p-4 space-y-3">
                            <h4 className="font-bold text-slate-900 text-sm border-b pb-2">Chú thích</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                    <span><b>Đã công bố</b>: Bạn đã xem được kết quả và nhận xét.</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                                    <span><b>Chờ công bố</b>: Điểm đang được GV cân nhắc/chỉnh sửa.</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                    <span><b>Chưa nộp</b>: Chưa ghi nhận bài làm từ bạn.</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Grade Table Section */}
                <Card className="lg:col-span-3 overflow-hidden border-slate-200 shadow-sm">
                    <CardContent className="p-0">
                        <Table>
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <Th className="py-4">Hạng mục đánh giá</Th>
                                    <Th>Trọng số</Th>
                                    <Th>Điểm / Tối đa</Th>
                                    <Th>Trạng thái</Th>
                                    <Th>Nhận xét từ GV</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.grade_items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <Td className="py-4">
                                            <div className="font-bold text-slate-900">{item.title}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                {item.type === 'QUIZ' ? 'Trắc nghiệm' : item.type === 'ESSAY' ? 'Tự luận' : item.type} • {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('vi-VN') : "Chưa nộp"}
                                            </div>
                                        </Td>
                                        <Td>
                                            <span className="font-semibold text-slate-600">
                                                {item.weight !== null && item.weight !== undefined ? `${item.weight}%` : '--'}
                                            </span>
                                        </Td>
                                        <Td>
                                            <div className="flex items-baseline gap-1">
                                                {item.status === "published" ? (
                                                    <span className="text-lg font-black text-blue-600">{item.score}</span>
                                                ) : (
                                                    <span className="text-lg font-bold text-slate-300">--</span>
                                                )}
                                                <span className="text-xs text-slate-400 font-medium">/ {item.max_score}</span>
                                            </div>
                                        </Td>
                                        <Td>
                                            {getStatusBadge(item.status)}
                                        </Td>
                                        <Td className="max-w-xs">
                                            {item.status === "published" ? (
                                                item.feedback ? (
                                                    <div className="flex gap-2 items-start text-xs text-slate-600 italic bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                                                        <MessageSquare className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />
                                                        <span>{item.feedback}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">Không có nhận xét</span>
                                                )
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-300 text-xs italic">
                                                    <Lock className="h-3 w-3" /> Nội dung ẩn
                                                </div>
                                            )}
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
                            <span>TỔNG TRỌNG SỐ ĐÃ TÍNH ĐIỂM</span>
                            <span className="text-lg text-blue-700">{data.total_weight}%</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
