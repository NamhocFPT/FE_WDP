// src/component/pages/admin/UserManagement.js
import React, { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, CardContent, Input, Button, Badge, Table, Th, Td, Modal } from "component/ui";
import { adminApi } from "service/adminApi";
import { Search, UserPlus, Edit2, Lock, Unlock, KeyRound, ChevronLeft, ChevronRight, FileSpreadsheet, Upload, Download, User } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import ImportUserModal from "./ImportUserModal";

export default function UserManagement() {
    // ── State ──
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: "", type: "" });

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // Form data
    const [createForm, setCreateForm] = useState({ email: "", full_name: "", role_code: "STUDENT" });
    const [editForm, setEditForm] = useState({ id: "", full_name: "", phone: "" });
    const [confirmAction, setConfirmAction] = useState({ type: "", user: null });
    const [generatedPassword, setGeneratedPassword] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // ── Fetch users ──
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminApi.getUsers({ search, role: roleFilter, status: statusFilter, page, limit: 15 });
            const result = res.data;
            if (result.success) {
                setUsers(result.data.users || []);
                setTotal(result.data.total || 0);
                setTotalPages(result.data.totalPages || 1);
            }
        } catch (err) {
            console.error("Lỗi tải danh sách người dùng:", err);
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, statusFilter, page]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Debounce search
    const [searchInput, setSearchInput] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const flash = (text, type = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    };

    // ── UC_ADM_05: Tạo tài khoản ──
    const handleCreate = async () => {
        if (!createForm.email || !createForm.full_name) return flash("Vui lòng nhập đầy đủ Email và Họ tên.", "error");
        setActionLoading(true);
        try {
            const res = await adminApi.createUser(createForm);
            const result = res.data;
            if (result.success) {
                setShowCreateModal(false);
                setCreateForm({ email: "", full_name: "", role_code: "STUDENT" });
                setGeneratedPassword(result.data.generated_password);
                setShowPasswordModal(true);
                fetchUsers();
            } else {
                flash(result.message || "Lỗi khi tạo tài khoản.", "error");
            }
        } catch (err) {
            flash(err.response?.data?.message || "Lỗi kết nối.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    // ── UC_ADM_07: Sửa thông tin ──
    const handleEdit = async () => {
        setActionLoading(true);
        try {
            const res = await adminApi.updateUser(editForm.id, { full_name: editForm.full_name, phone: editForm.phone });
            if (res.data.success) {
                flash("Cập nhật thông tin thành công!");
                setShowEditModal(false);
                fetchUsers();
            } else {
                flash(res.data.message || "Lỗi cập nhật.", "error");
            }
        } catch (err) {
            flash(err.response?.data?.message || "Lỗi kết nối.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    // ── UC_ADM_08: Khóa / Mở khóa ──
    const handleToggleStatus = async () => {
        setActionLoading(true);
        try {
            const res = await adminApi.toggleUserStatus(confirmAction.user.id);
            if (res.data.success) {
                flash(res.data.message);
                setShowConfirmModal(false);
                fetchUsers();
            }
        } catch (err) {
            flash(err.response?.data?.message || "Lỗi.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    // ── UC_ADM_09: Cấp lại mật khẩu ──
    const handleResetPassword = async () => {
        setActionLoading(true);
        try {
            const res = await adminApi.resetUserPassword(confirmAction.user.id);
            if (res.data.success) {
                setShowConfirmModal(false);
                setGeneratedPassword(res.data.data.generated_password);
                setShowPasswordModal(true);
                fetchUsers();
            }
        } catch (err) {
            flash(err.response?.data?.message || "Lỗi.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    // ── UC_ADM_05: Download Template (.xlsx) ──
    const handleDownloadTemplate = () => {
        const templateData = [
            { "Email": "gv_example@smartedu.vn", "Họ tên": "Nguyễn Văn A", "Vai trò": "Giáo viên" },
            { "Email": "hv_example@smartedu.vn", "Họ tên": "Trần Thị B", "Vai trò": "Học sinh" }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        ws["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Template_Import_User.xlsx");
    };

    const handleExportData = async () => {
        try {
            const res = await adminApi.getUsers({ search, role: roleFilter, status: statusFilter, page: 1, limit: 10000 });
            if (res.data.success) {
                const exportData = res.data.data.users.map(u => {
                    const code = u.role?.code || "";
                    const roleNameMap = { ADMIN: "Quản trị viên", TEACHER: "Giáo viên", STUDENT: "Học sinh" };
                    return {
                        "Họ tên": u.full_name,
                        "Email": u.email,
                        "Số điện thoại": u.phone || "",
                        "Vai trò": roleNameMap[code] || code,
                        "Trạng thái": u.status === "active" ? "Đang hoạt động" : "Bị khóa"
                    };
                });
                const ws = XLSX.utils.json_to_sheet(exportData);
                ws["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_Nguoi_Dung");
                XLSX.writeFile(wb, "Danh_sach_Nguoi_Dung.xlsx");
            }
        } catch (err) {
            toast.error("Không thể xuất danh sách người dùng.");
        }
    };

    const openConfirm = (type, user) => {
        setConfirmAction({ type, user });
        setShowConfirmModal(true);
    };

    const getRoleBadge = (user) => {
        const code = user.role?.code || "";
        const roleNameMap = { ADMIN: "Quản trị viên", TEACHER: "Giáo viên", STUDENT: "Học sinh" };
        const toneMap = { ADMIN: "red", TEACHER: "blue", STUDENT: "green" };
        return <Badge tone={toneMap[code] || "slate"}>{roleNameMap[code] || code}</Badge>;
    };

    return (
        <div className="space-y-4">
            <PageHeader
                title="Quản lý Người dùng"
                subtitle={`Tổng cộng ${total} tài khoản trong hệ thống.`}
                right={[
                    <Button key="export" variant="outline" size="sm" className="border-cyan-200 text-cyan-600 hover:bg-cyan-50" onClick={handleExportData}>
                        <Download className="h-4 w-4 mr-1.5" /> Xuất Excel
                    </Button>,
                    <Button key="template" variant="outline" size="sm" onClick={handleDownloadTemplate} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                        <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Tải về File mẫu
                    </Button>,
                    <Button key="import" variant="outline" size="sm" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => setShowImportModal(true)}>
                        <Upload className="h-4 w-4 mr-1.5" /> Import danh sách
                    </Button>,
                    <Button key="add" size="sm" onClick={() => setShowCreateModal(true)}>
                        <UserPlus className="h-4 w-4 mr-1.5" /> Thêm mới
                    </Button>,
                ]}
            />

            {/* Flash message */}
            {message.text && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${message.type === "error" ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Tìm kiếm theo tên hoặc email..."
                                className="pl-10"
                            />
                        </div>
                        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
                            <option value="all">Tất cả Vai trò</option>
                            <option value="ADMIN">Quản trị viên</option>
                            <option value="TEACHER">Giáo viên</option>
                            <option value="STUDENT">Học sinh</option>
                        </select>
                        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="all">Tất cả Trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="blocked">Đã bị khóa</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center p-16">
                            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center p-16 text-slate-400">
                            <p className="text-lg font-bold">Không có dữ liệu</p>
                            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <thead>
                                        <tr>
                                            <Th>Người dùng</Th>
                                            <Th>Email</Th>
                                            <Th>Số điện thoại</Th>
                                            <Th>Vai trò</Th>
                                            <Th>Trạng thái</Th>
                                            <Th className="text-right">Thao tác</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-slate-50/80 group">
                                                <Td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                            {u.avatar_url ? (
                                                                <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <User className="h-5 w-5 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <span className="font-semibold text-slate-900">{u.full_name}</span>
                                                    </div>
                                                </Td>
                                                <Td className="text-slate-600">{u.email}</Td>
                                                <Td className="text-slate-500">{u.phone || "—"}</Td>
                                                <Td>{getRoleBadge(u)}</Td>
                                                <Td>
                                                    <Badge tone={u.status === "active" ? "green" : "red"}>
                                                        {u.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                                                    </Badge>
                                                </Td>
                                                <Td className="text-right">
                                                    <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Button size="xs" variant="outline" title="Sửa thông tin" onClick={() => { setEditForm({ id: u.id, full_name: u.full_name, phone: u.phone || "" }); setShowEditModal(true); }}>
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            variant="outline"
                                                            title={u.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                                            className={u.status === "active" ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}
                                                            onClick={() => openConfirm("toggle", u)}
                                                        >
                                                            {u.status === "active" ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                                                        </Button>
                                                        <Button size="xs" variant="outline" title="Cấp lại mật khẩu" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => openConfirm("reset", u)}>
                                                            <KeyRound className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                                    <span className="text-xs text-slate-500">Trang {page} / {totalPages} — {total} kết quả</span>
                                    <div className="flex gap-2">
                                        <Button size="xs" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button size="xs" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ── Modal: Tạo tài khoản (UC_ADM_05) ── */}
            <Modal open={showCreateModal} title="Tạo tài khoản mới" onClose={() => setShowCreateModal(false)}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                        <Input placeholder="user@example.com" value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Họ tên <span className="text-red-500">*</span></label>
                        <Input placeholder="Nguyễn Văn A" value={createForm.full_name} onChange={(e) => setCreateForm(f => ({ ...f, full_name: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Vai trò</label>
                        <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={createForm.role_code} onChange={(e) => setCreateForm(f => ({ ...f, role_code: e.target.value }))}>
                            <option value="TEACHER">Giáo viên</option>
                            <option value="STUDENT">Học sinh</option>
                        </select>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100">
                        Hệ thống sẽ tự sinh mật khẩu ngẫu nhiên và hiển thị sau khi tạo.
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>Hủy</Button>
                        <Button onClick={handleCreate} disabled={actionLoading}>
                            {actionLoading ? "Đang tạo..." : "Tạo tài khoản"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── Modal: Sửa thông tin (UC_ADM_07) ── */}
            <Modal open={showEditModal} title="Sửa thông tin người dùng" onClose={() => setShowEditModal(false)}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Họ tên</label>
                        <Input value={editForm.full_name} onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                        <Input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="0912345678" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setShowEditModal(false)}>Hủy</Button>
                        <Button onClick={handleEdit} disabled={actionLoading}>
                            {actionLoading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── Modal: Xác nhận (UC_ADM_08 / UC_ADM_09) ── */}
            <Modal open={showConfirmModal} title="Xác nhận thao tác" onClose={() => setShowConfirmModal(false)}>
                <div className="space-y-4">
                    {confirmAction.type === "toggle" && (
                        <p className="text-sm text-slate-600">
                            Bạn có chắc muốn <strong>{confirmAction.user?.status === "active" ? "khóa" : "mở khóa"}</strong> tài khoản <strong>{confirmAction.user?.full_name}</strong> ({confirmAction.user?.email})?
                            {confirmAction.user?.status === "active" && <span className="block mt-2 text-amber-600 font-semibold">⚠ Người dùng sẽ không thể đăng nhập sau khi bị khóa.</span>}
                        </p>
                    )}
                    {confirmAction.type === "reset" && (
                        <p className="text-sm text-slate-600">
                            Bạn có chắc muốn cấp lại mật khẩu mới cho <strong>{confirmAction.user?.full_name}</strong> ({confirmAction.user?.email})?
                        </p>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Hủy</Button>
                        <Button
                            className={confirmAction.type === "toggle" && confirmAction.user?.status === "active" ? "bg-amber-600 text-white hover:bg-amber-700" : ""}
                            onClick={confirmAction.type === "toggle" ? handleToggleStatus : handleResetPassword}
                            disabled={actionLoading}
                        >
                            {actionLoading ? "Đang xử lý..." : "Đồng ý"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── Modal: Hiển thị mật khẩu mới ── */}
            <Modal open={showPasswordModal} title="Mật khẩu đã được tạo" onClose={() => setShowPasswordModal(false)}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Mật khẩu đã được sinh và gán cho tài khoản. Hãy ghi lại và gửi cho người dùng:</p>
                    <div className="p-4 bg-slate-900 rounded-xl text-center">
                        <code className="text-lg font-bold text-emerald-400 select-all">{generatedPassword}</code>
                    </div>
                    <p className="text-xs text-slate-400 italic">Người dùng sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.</p>
                    <div className="flex justify-end">
                        <Button onClick={() => setShowPasswordModal(false)}>Đóng</Button>
                    </div>
                </div>
            </Modal>

            {/* ── Modal: Review Import (A1) ── */}
            <ImportUserModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={fetchUsers}
                onDownloadTemplate={handleDownloadTemplate}
            />
        </div>
    );
}
