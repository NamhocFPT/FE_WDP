// src/component/pages/admin/CourseManagement.js
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "service/adminApi";
import { Button, Table, Th, Td } from "component/ui";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  Download,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import ImportCourseModal from "./ImportCourseModal";

export default function CourseManagement() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // States cho Modal Thêm/Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    expected_sessions: "",
    description: "",
    status: "active",
  });

  // States cho Modal Xác nhận xóa mềm (Ẩn đi)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCourses({ page, limit, q, status: statusFilter });
      setCourses(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Lỗi khi tải danh sách:", err);
      toast.error("Không thể tải danh sách môn học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset về trang 1 khi search hoặc filter thay đổi
    setPage(1);
  }, [q, statusFilter]);

  useEffect(() => {
    fetchCourses();
  }, [page, limit, q, statusFilter]);

  // Xử lý khi nhấn nút Sửa
  const handleEditClick = (course) => {
    setEditId(course.id);
    setFormData({
      code: course.code,
      name: course.name,
      expected_sessions: course.expected_sessions,
      description: course.description || "",
      status: course.status || "active",
    });
    setIsModalOpen(true);
  };

  // Xử lý khi nhấn nút Xóa (Mở popup xác nhận)
  const handleDeleteClick = (course) => {
    setItemToDelete(course);
    setIsDeleteModalOpen(true);
  };

  // Thực hiện ẩn môn học (Update is_deleted = true)
  const confirmHide = async () => {
    setLoading(true);
    try {
      // Thay vì updateCourse, gọi hàm deleteCourse của Backend xử lý xóa mềm và kiểm tra logic
      await adminApi.deleteCourse(itemToDelete.id);
      await fetchCourses();
      setIsDeleteModalOpen(false);
      toast.success("Xóa môn học thành công!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi ẩn môn học!");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý gửi form (Thêm mới hoặc Cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await adminApi.updateCourse(editId, formData);
        toast.success("Cập nhật môn học thành công!");
      } else {
        await adminApi.addCourse(formData);
        toast.success("Thêm mới môn học thành công!");
      }
      await fetchCourses();
      setIsModalOpen(false);
      setEditId(null);
      setFormData({
        code: "",
        name: "",
        expected_sessions: "",
        description: "",
        status: "active",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Thao tác thất bại!");
    } finally {
      setLoading(false);
    }
  };

  // Rows bây giờ lấy trực tiếp từ state courses vì backend đã xử lý filter/mảng rồi
  const rows = useMemo(() => {
    return courses;
  }, [courses]);

  // File Excel Template Download
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Mã môn": "TOAN10",
        "Tên môn": "Toán lớp 10",
        "Số tiết": 45,
        "Mô tả": "Dành cho học sinh khối 10",
      },
      {
        "Mã môn": "VAN11",
        "Tên môn": "Ngữ Văn lớp 11",
        "Số tiết": 45,
        "Mô tả": "Dành cho học sinh khối 11",
      },
      {
        "Mã môn": "ANH12",
        "Tên môn": "Tiếng Anh lớp 12",
        "Số tiết": 45,
        "Mô tả": "Hệ chuẩn 7 năm",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Import_Course.xlsx");
  };

  const handleExportData = () => {
    const exportData = rows.map((c) => ({
      "Mã môn": c.code,
      "Tên môn": c.name,
      "Số tiết": c.expected_sessions || 0,
      "Mô tả": c.description || "",
      "Trạng thái":
        c.status === "active" ? "Đang hoạt động" : "Ngưng hoạt động",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 40 },
      { wch: 15 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_Mon_Hoc");
    XLSX.writeFile(wb, "Danh_sach_Mon_Hoc.xlsx");
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f8fafc] p-8 space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý Môn học
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh sách môn học và chương trình giảng dạy
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-cyan-200 text-cyan-600 hover:bg-cyan-50 h-10 px-4"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" /> Xuất Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-600 hover:bg-blue-50 h-10 px-4"
            onClick={handleDownloadTemplate}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Tải về File mẫu
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 h-10 px-4"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="h-4 w-4 mr-2" /> Import danh sách
          </Button>
          <Button
            className="bg-[#2563eb] text-white h-10 px-5 rounded-lg flex items-center font-semibold shadow-sm"
            onClick={() => {
              setEditId(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} className="mr-2" /> Thêm Môn học
          </Button>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm theo mã hoặc tên môn học..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <select
          className="border border-slate-200 rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 bg-white min-w-[200px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tất cả Trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Ngưng hoạt động</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1">
        <Table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50/50">
              <Th className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4 px-6 text-left">
                Mã Môn học
              </Th>
              <Th className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4 px-6 text-left">
                Tên Môn học
              </Th>
              <Th className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4 px-6 text-left">
                Số buổi dự kiến
              </Th>
              <Th className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4 px-6 text-left">
                Trạng thái
              </Th>
              <Th className="text-[11px] font-bold text-slate-400 uppercase tracking-widest py-4 px-6 text-center">
                Thao tác
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((c) => (
              <tr
                key={c.id}
                className="hover:bg-slate-50 transition-colors group"
              >
                <Td className="py-4 px-6 text-sm text-slate-600 font-medium">
                  {c.code}
                </Td>
                <Td className="py-4 px-6 text-sm text-slate-900 font-semibold">
                  {c.name}
                </Td>
                <Td className="py-4 px-6 text-sm text-slate-600">
                  {c.expected_sessions || 0}
                </Td>
                <Td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      c.status === "inactive"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {c.status === "inactive"
                      ? "Ngưng hoạt động"
                      : "Đang hoạt động"}
                  </span>
                </Td>
                <Td className="py-4 px-6 text-center">
                  <div className="flex justify-center gap-4">
                    <FolderOpen
                      size={16}
                      className="text-emerald-500 cursor-pointer hover:text-emerald-700"
                      title="Tài liệu"
                      onClick={() =>
                        nav(`/admin/courses/${c.id}/public-materials`)
                      }
                    />
                    <Pencil
                      size={16}
                      className="text-blue-500 cursor-pointer hover:text-blue-700"
                      onClick={() => handleEditClick(c)}
                    />
                    <Trash2
                      size={16}
                      className="text-red-500 cursor-pointer hover:text-red-700"
                      onClick={() => handleDeleteClick(c)}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-slate-500">
          Hiển thị <span className="font-semibold text-slate-700">{rows.length}</span> trên{" "}
          <span className="font-semibold text-slate-700">{total}</span> môn học
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="h-9 px-4 border-slate-200"
          >
            Trước
          </Button>
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => {
               // Hiển thị tối đa 5 trang xung quanh trang hiện tại
               if (totalPages > 5) {
                 if (i + 1 < page - 2 || i + 1 > page + 2) return null;
               }
               return (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                    page === i + 1
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
               );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages || loading}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="h-9 px-4 border-slate-200"
          >
            Sau
          </Button>
        </div>
      </div>

      {/* POPUP THÊM/SỬA (Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl w-[500px] overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {editId ? "Chỉnh sửa Môn học" : "Thêm Môn học mới"}
              </h2>
              <X
                className="cursor-pointer text-slate-400 hover:text-slate-600"
                onClick={() => setIsModalOpen(false)}
              />
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                    Mã
                  </label>
                  <input
                    required
                    disabled={editId !== null}
                    className="w-full border border-slate-200 p-2 rounded text-sm focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                    Số buổi
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full border border-slate-200 p-2 rounded text-sm focus:border-blue-500 outline-none"
                    value={formData.expected_sessions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expected_sessions: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  Tên Môn học
                </label>
                <input
                  required
                  className="w-full border border-slate-200 p-2 rounded text-sm focus:border-blue-500 outline-none"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  Mô tả
                </label>
                <textarea
                  className="w-full border border-slate-200 p-2 rounded text-sm h-20 outline-none focus:border-blue-500"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  Trạng thái
                </label>
                <select
                  className="w-full border border-slate-200 p-2 rounded text-sm bg-white outline-none focus:border-blue-500 cursor-pointer"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngưng hoạt động</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  disabled={loading}
                  type="submit"
                  className="bg-[#2563eb] text-white text-xs px-6 font-semibold"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2" size={14} />
                  ) : null}{" "}
                  {editId ? "Cập nhật" : "Tạo mới"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN ẨN (Soft Delete Confirmation) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110]">
          <div className="bg-white rounded-xl shadow-2xl w-[400px] p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            {/* Warning Icon Container */}
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>

            {/* Modal Content */}
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Xác nhận xóa?
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Môn học{" "}
                <span className="font-bold text-slate-800">
                  "{itemToDelete?.name}"
                </span>{" "}
                sẽ được ẩn khỏi danh sách. Bạn có chắc chắn muốn tiếp tục?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Hủy
              </button>
              <button
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                onClick={confirmHide}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Xác nhận"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportCourseModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchCourses}
        onDownloadTemplate={handleDownloadTemplate}
      />
    </div>
  );
}
