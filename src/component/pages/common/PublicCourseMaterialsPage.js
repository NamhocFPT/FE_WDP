import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  Download,
  File,
  FileArchive,
  FileImage,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Film,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
} from "component/ui";
import { publicMaterialApi } from "service/publicMaterialApi";
import { store } from "service/store";

const fileMeta = {
  pdf: { icon: FileText, tone: "bg-blue-50 text-blue-600" },
  doc: { icon: FileText, tone: "bg-blue-50 text-blue-600" },
  text: { icon: FileText, tone: "bg-blue-50 text-blue-600" },
  spreadsheet: {
    icon: FileSpreadsheet,
    tone: "bg-emerald-50 text-emerald-600",
  },
  image: { icon: FileImage, tone: "bg-amber-50 text-amber-600" },
  video: { icon: Film, tone: "bg-rose-50 text-rose-600" },
  archive: { icon: FileArchive, tone: "bg-violet-50 text-violet-600" },
};

const formatBytes = (bytes) => {
  if (bytes == null) return "Khong ro dung luong";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${Number((bytes / 1024 ** i).toFixed(2))} ${units[i]}`;
};

const formatDateTime = (value) => {
  if (!value) return "Khong ro ngay tao";
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm");
  } catch {
    return value;
  }
};

const normalizeFileUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  let normalized = url;
  const duplicateExtensionPattern = /(\.[a-z0-9]+)\1(?=($|[?#]))/i;

  while (duplicateExtensionPattern.test(normalized)) {
    normalized = normalized.replace(duplicateExtensionPattern, "$1");
  }

  return normalized;
};

function StateCard({ icon, title, description, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50",
    red: "border-red-200 bg-red-50",
    blue: "border-cyan-200 bg-cyan-50",
  };

  return (
    <Card className={`rounded-[28px] border-2 border-dashed ${tones[tone]}`}>
      <CardContent className="flex flex-col items-center px-6 py-14 text-center">
        <div className="rounded-full bg-white/80 p-4 text-cyan-600">{icon}</div>
        <h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export default function PublicCourseMaterialsPage() {
  const isTeacher = store.getCurrentUser()?.role === "teacher";
  const [courseCode, setCourseCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [searchedCode, setSearchedCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);

  const copy = useMemo(
    () => ({
      title: isTeacher ? "Tài liệu" : "Tài liệu học tập",
      subtitle: isTeacher
        ? "Tìm nhanh tài liệu công khai theo mã môn để tham khảo và hỗ trợ lớp học."
        : "Nhập mã môn để tra cứu tài liệu công khai đang được phát hành cho người học.",
    }),
    [isTeacher],
  );

  const handleSearch = async (event) => {
    event.preventDefault();
    const normalizedCode = courseCode.trim().toUpperCase();
    if (!normalizedCode) return toast.error("Vui long nhap ma mon hoc.");

    setStatus("loading");
    setSearchedCode(normalizedCode);
    setErrorMessage("");

    try {
      const res = await publicMaterialApi.searchByCourseCode(normalizedCode);
      if (!res.ok) {
        setResult(null);
        if (res.status === 404) {
          setStatus("not-found");
          return;
        }
        const message =
          res.data?.message || "Khong the tim thay tai lieu luc nay.";
        setErrorMessage(message);
        setStatus("error");
        toast.error(message);
        return;
      }

      const data = res.data?.data || {};
      const materials = Array.isArray(data.materials) ? data.materials : [];
      setResult({ course: data.course || null, materials });
      setStatus(materials.length ? "success" : "empty");
    } catch (error) {
      const message = error.message || "Co loi ket noi khi tim kiem tai lieu.";
      setResult(null);
      setErrorMessage(message);
      setStatus("error");
      toast.error(message);
    }
  };

  const handleView = async (item) => {
    try {
      let fileUrl = normalizeFileUrl(item.file_url);
      if (item.type === "link") {
        window.open(fileUrl, "_blank");
        return;
      }
      
      toast.info(`Đang mở file: ${item.original_filename || item.title}...`);
      let fetchUrl = fileUrl;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      let blob = await response.blob();
      
      if (item.type === "pdf") {
        blob = new Blob([blob], { type: "application/pdf" });
      }
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error(error);
      let fallbackUrl = normalizeFileUrl(item.file_url);
      window.open(fallbackUrl, "_blank");
    }
  };

  const handleDownload = async (event, item) => {
    event.preventDefault();
    try {
      const fileUrl = normalizeFileUrl(item.file_url);
      if (item.type === "link") {
        window.open(fileUrl, "_blank");
        return;
      }

      toast.info(`Đang chuẩn bị tải: ${item.original_filename || item.title}`);

      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Không thể tải file");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = item.original_filename || item.title || "tài-liệu";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download error:", error);
      let fallbackUrl = normalizeFileUrl(item.file_url);
      
      const a = document.createElement("a");
      a.href = fallbackUrl;
      a.download = item.original_filename || item.title || "tài-liệu";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="grid gap-8 overflow-hidden rounded-[32px] bg-gradient-to-br from-cyan-950 via-slate-900 to-emerald-700 p-7 text-white shadow-xl lg:grid-cols-[1.2fr,1fr] lg:items-center">
        <div>
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            Public Materials Search
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            Tìm tài liệu theo mã môn chỉ trong vài giây.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-cyan-50/85">
            Kết quả chỉ bao gồm tài liệu active và visible, nên đây là danh sách
            công khai hiện hành mà teacher/student thực sự nhìn thấy.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl"
        >
          <label className="text-sm font-semibold text-cyan-50">
            Mã môn học
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                value={courseCode}
                onChange={(event) =>
                  setCourseCode(event.target.value.toUpperCase())
                }
                placeholder="Ví dụ: TOAN10"
                className="h-12 border-white/20 bg-white pl-11 text-base text-slate-900 placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <Button
              type="submit"
              className="h-12 gap-2 bg-emerald-500 text-white hover:bg-emerald-400"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
              Tìm kiếm
            </Button>
          </div>
          <div className="mt-3 text-xs text-cyan-50/80">
            Gợi ý: nhập đúng course code như TOAN10, VAN11, ANH12 để có kết quả
            tốt nhất.
          </div>
        </form>
      </section>

      {status === "idle" && (
        <StateCard
          icon={<FileSearch size={28} />}
          title="Sẵn sàng tra cứu"
          description="Nhập mã môn học ở phía trên để xem danh sách tài liệu công khai tương ứng."
          tone="blue"
        />
      )}
      {status === "loading" && (
        <StateCard
          icon={<Loader2 size={28} className="animate-spin" />}
          title="Đang tìm kiếm"
          description={`Hệ thống đang tra cứu tài liệu công khai cho mã môn ${searchedCode}.`}
          tone="blue"
        />
      )}
      {status === "not-found" && (
        <StateCard
          icon={<Search size={28} className="text-red-500" />}
          title="Không tìm thấy môn học"
          description={`Không có môn học nào khớp với mã ${searchedCode}. Vui lòng kiểm tra lại và thử lần nữa.`}
          tone="red"
        />
      )}
      {status === "error" && (
        <StateCard
          icon={<FileSearch size={28} className="text-red-500" />}
          title="Không thể tải dữ liệu"
          description={
            errorMessage ||
            "Đã có lỗi xảy ra trong quá trình tìm kiếm tài liệu."
          }
          tone="red"
        />
      )}

      {(status === "success" || status === "empty") && result?.course ? (
        <div className="space-y-6">
          <Card className="rounded-[28px] border-slate-200 shadow-sm">
            <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-[1fr,auto] md:items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">
                  Kết quả tìm kiếm
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-black text-slate-900">
                    {result.course.code}
                  </h3>
                  <Badge tone="blue">Public materials</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {result.course.name}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Tài liệu
                </div>
                <div className="mt-1 text-3xl font-black text-slate-900">
                  {result.materials.length}
                </div>
              </div>
            </CardContent>
          </Card>

          {status === "empty" ? (
            <StateCard
              icon={<FileText size={28} />}
              title="Môn học này chưa có tài liệu public"
              description="Bạn đã tìm đúng môn, nhưng hiện chưa có tài liệu active và visible để hiển thị."
              tone="blue"
            />
          ) : (
            <Card className="overflow-hidden rounded-[28px] border-slate-200 shadow-sm">
              <CardContent className="divide-y divide-slate-100 p-0">
                {result.materials.map((item) => {
                  const meta = fileMeta[item.type] || {
                    icon: File,
                    tone: "bg-slate-100 text-slate-600",
                  };
                  const Icon = meta.icon;
                  const fileUrl = normalizeFileUrl(item.file_url);
                  return (
                    <div
                      key={item.id}
                      className="grid gap-5 px-6 py-5 lg:grid-cols-[1fr,auto]"
                    >
                      <div className="flex gap-4">
                        <div
                          className={`mt-1 flex h-12 w-12 items-center justify-center rounded-2xl ${meta.tone}`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900">
                              {item.title}
                            </h4>
                            <Badge tone="green">Active</Badge>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {item.description || "Chưa có mô tả."}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {item.original_filename || "Khong ro ten file"}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {formatBytes(item.file_size)}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              Tạo lúc {formatDateTime(item.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-start justify-end gap-2">
                        <button
                          onClick={() => handleView(item)}
                          className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 cursor-pointer"
                        >
                          Mở
                          <ArrowRight size={14} className="ml-2" />
                        </button>
                        <button
                          onClick={(e) => handleDownload(e, item)}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Download size={14} className="mr-2" />
                          Tải
                        </button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
