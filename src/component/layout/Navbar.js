import { NavLink, useNavigate, Link } from "react-router-dom";
import { store } from "service/store";
import { Button, cn } from "component/ui";
import NotificationBell from "./NotificationBell";
import { navByRole } from "./navigation";

export default function Navbar() {
    const user = store.getCurrentUser();
    const navigate = useNavigate();
    const roleKey = user?.role?.toLowerCase();
    const items = navByRole[roleKey] || [];

    const onLogout = async () => {
        await store.logout();
        navigate("/login", { replace: true });
    };

    return (
        <header className="sticky top-0 z-[50] border-b border-slate-100 bg-white/95 backdrop-blur-xl px-2 sm:px-4 shadow-sm">
            <div className="flex items-center gap-8 h-16">
                {/* Logo - Far Left (Reduced padding) */}
                <Link to="/" className="flex items-center gap-2 pl-2">
                    <div className="bg-blue-600 h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-100">
                         <span className="text-lg font-black">S</span>
                    </div>
                    <div className="text-lg font-black tracking-tight text-slate-900 border-r border-slate-200 pr-6 mr-1">
                        Smart<span className="text-blue-600">Edu</span>
                    </div>
                </Link>
                
                {/* Nav items aligned to the left after logo */}
                <nav className="hidden md:flex items-center gap-0.5 h-full">
                    {items.map((it) => (
                        <NavLink
                            key={it.to}
                            to={it.to}
                            end={it.to === "/admin" || it.to === "/teacher" || it.to === "/student"}
                            className={({ isActive }) =>
                                cn(
                                    "px-4 py-2 text-sm font-bold transition-all rounded-lg whitespace-nowrap h-10 flex items-center relative",
                                    isActive 
                                        ? "text-blue-600 bg-blue-50/50" 
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/80"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {it.label}
                                    {isActive && (
                                        <div className="absolute bottom-[-13px] left-3 right-3 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.3)]"></div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-4 pr-2">
                    <NotificationBell />

                    <div className="h-6 w-px bg-slate-200"></div>

                    <Link to="/profile" className="flex items-center gap-3 hover:bg-slate-50 p-1 rounded-xl transition-all cursor-pointer group">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-xs font-black text-slate-900 leading-none mb-0.5">{user?.full_name || user?.fullName}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                {user?.role === 'ADMIN' ? 'Quản trị viên' : (user?.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh')}
                            </span>
                        </div>
                        <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs border border-white/50 shadow-lg">
                            {(user?.full_name || user?.fullName || "A").charAt(0).toUpperCase()}
                        </div>
                    </Link>
                    
                    <Button variant="danger" size="sm" onClick={onLogout} className="rounded-lg px-4 h-9 font-bold">
                        Đăng xuất
                    </Button>
                </div>
            </div>
        </header>
    );
}