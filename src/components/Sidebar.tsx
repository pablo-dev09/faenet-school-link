import { Home, Search, Bell, User, LogOut, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";

export default function Sidebar() {
  const { user, signOut } = useAuth();

  const base =
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground";
  const active = "bg-primary/10 text-primary font-semibold";

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col border-r bg-card p-4">
      <div className="mb-8 flex items-center gap-2.5 px-3 pt-2">
        <img src={logo} alt="FaeNet" className="h-7 w-auto" />
        <span className="text-base font-bold tracking-tight text-foreground">FaeNet</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        <NavLink to="/" className={base} activeClassName={active} end>
          <Home size={20} /> Inicio
        </NavLink>
        <NavLink to="/explore" className={base} activeClassName={active}>
          <Search size={20} /> Explorar
        </NavLink>
        <NavLink to="/notifications" className={base} activeClassName={active}>
          <Bell size={20} /> Notificacoes
        </NavLink>
        <NavLink to={`/profile/${user?.id}`} className={base} activeClassName={active}>
          <User size={20} /> Perfil
        </NavLink>
      </nav>

      <div className="space-y-1 border-t pt-3">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut size={20} /> Sair
        </button>
      </div>
    </aside>
  );
}
