import { Home, Search, Bell, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";

export default function BottomNav() {
  const { user } = useAuth();
  const base =
    "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors py-1.5 min-w-[3.5rem]";
  const active = "text-primary";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md md:hidden safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1.5">
        <NavLink to="/" className={base} activeClassName={active} end>
          <Home size={22} strokeWidth={1.8} />
          <span>Inicio</span>
        </NavLink>
        <NavLink to="/explore" className={base} activeClassName={active}>
          <Search size={22} strokeWidth={1.8} />
          <span>Buscar</span>
        </NavLink>
        <NavLink to="/notifications" className={base} activeClassName={active}>
          <Bell size={22} strokeWidth={1.8} />
          <span>Avisos</span>
        </NavLink>
        <NavLink to={`/profile/${user?.id}`} className={base} activeClassName={active}>
          <User size={22} strokeWidth={1.8} />
          <span>Perfil</span>
        </NavLink>
      </div>
    </nav>
  );
}
