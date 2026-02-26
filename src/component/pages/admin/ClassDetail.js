import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "service/adminApi";
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Badge, Button, Table, Th, Td } from "component/ui";
import { Info, BookOpen, Users, Calendar, ChevronLeft, UserPlus, Upload, Plus } from "lucide-react";

export default function ClassDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [activeTab, setActiveTab] = useState("Overview");
    const [cl, setCl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await adminApi.getClassDetail(id);
                setCl(res.data.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching class detail:", err);
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading class information...</div>;
    if (!cl) return <div className="p-8 text-center text-red-500">Class not found.</div>;

    const tabs = [
        { id: "Overview", icon: <Info size={16}/> },
        { id: "Teachers", icon: <BookOpen size={16}/> },
        { id: "Students", icon: <Users size={16}/> },
        { id: "Schedule", icon: <Calendar size={16}/> }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => nav("/admin/classes")} className="p-2 hover:bg-slate-100 rounded-full transition">
                    <ChevronLeft size={24} />
                </button>
                <PageHeader 
                    title={cl.name} 
                    subtitle={cl.course?.name} 
                    right={[<Badge key="cap" tone="indigo">{cl.enrollments?.length || 0}/40 Students</Badge>]}
                />
            </div>

            {/* Tab Navigation chuẩn Figma */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {tab.icon} {tab.id}
                    </button>
                ))}
            </div>

            <div className="mt-4">
                {activeTab === "Overview" && <OverviewTab cl={cl} />}
                {activeTab === "Teachers" && <TeachersTab cl={cl} />}
                {activeTab === "Students" && <StudentsTab cl={cl} />}
                {activeTab === "Schedule" && <ScheduleTab cl={cl} />}
            </div>
        </div>
    );
}

// --- Định nghĩa các Tab Component để sửa lỗi 'is not defined' ---

const OverviewTab = ({ cl }) => (
    <div className="grid gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader><CardTitle>Class Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm italic">
                <div><label className="text-slate-400 block not-italic font-medium">Semester</label><span className="font-bold">Spring 2026</span></div>
                <div><label className="text-slate-400 block not-italic font-medium">Start Date</label><span className="font-bold">{cl.start_date}</span></div>
                <div><label className="text-slate-400 block not-italic font-medium">Capacity</label><span className="font-bold">40 students</span></div>
                <div><label className="text-slate-400 block not-italic font-medium">Status</label><Badge tone="green">{cl.status}</Badge></div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex justify-between items-center"><CardTitle>Main Teacher</CardTitle><Button variant="outline" size="sm">Change</Button></CardHeader>
            <CardContent className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {cl.teacher?.full_name?.charAt(0) || "T"}
                </div>
                <div>
                    <div className="font-bold text-slate-900">{cl.teacher?.full_name || "Unassigned"}</div>
                    <div className="text-xs text-slate-500">Primary Instructor</div>
                </div>
            </CardContent>
        </Card>
    </div>
);

const TeachersTab = ({ cl }) => (
    <Card>
        <CardHeader className="flex justify-between items-center">
            <CardTitle>Assigned Teachers</CardTitle>
            <Button size="sm" className="bg-blue-600"><UserPlus size={16} className="mr-2"/> Assign Teacher</Button>
        </CardHeader>
        <CardContent>
            <Table>
                <thead><tr><Th>Name</Th><Th>Email</Th><Th>Role</Th></tr></thead>
                <tbody>
                    <tr>
                        <Td className="font-bold">{cl.teacher?.full_name}</Td>
                        <Td>{cl.teacher?.email}</Td>
                        <Td><Badge tone="blue">Primary</Badge></Td>
                    </tr>
                </tbody>
            </Table>
        </CardContent>
    </Card>
);

const StudentsTab = ({ cl }) => (
    <Card>
        <CardHeader className="flex justify-between items-center">
            <CardTitle>Enrolled Students</CardTitle>
            <div className="flex gap-2">
                <Button variant="outline" size="sm"><Upload size={16} className="mr-2"/> Import</Button>
                <Button size="sm" className="bg-blue-600"><Plus size={16} className="mr-2"/> Add Student</Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <thead><tr><Th>Name</Th><Th>Email</Th><Th>Student ID</Th></tr></thead>
                <tbody>
                    {cl.enrollments?.map(en => (
                        <tr key={en.id}>
                            <Td className="font-bold">{en.student?.full_name}</Td>
                            <Td>{en.student?.email}</Td>
                            <Td>ST{en.student?.id}</Td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </CardContent>
    </Card>
);

const ScheduleTab = ({ cl }) => (
    <Card>
        <CardHeader className="flex justify-between items-center">
            <CardTitle>Class Sessions</CardTitle>
            <Button size="sm" className="bg-blue-600"><Plus size={16} className="mr-2"/> Add Session</Button>
        </CardHeader>
        <CardContent>
            <Table>
                <thead><tr><Th>Day</Th><Th>Time</Th><Th>Location</Th></tr></thead>
                <tbody>
                    {cl.sessions?.map(s => (
                        <tr key={s.id}>
                            <Td className="font-bold">{s.scheduled_date}</Td>
                            <Td>09:00 - 10:30</Td>
                            <Td><Badge tone="slate">Room 301</Badge></Td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </CardContent>
    </Card>
);