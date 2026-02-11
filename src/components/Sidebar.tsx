import { Home, Search, PlusSquare, Bell, User, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const base = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted";
  const active = "bg-muted text-primary";

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col border-r bg-card p-4">
      <div className="mb-8 flex items-center gap-2 px-3">
        <img src={logo} alt="FaeNet" className="h-8 w-auto" />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink to="/" className={base} activeClassName={active} end>
          <Home size={20} /> Início
        </NavLink>
        <NavLink to="/explore" className={base} activeClassName={active}>
          <Search size={20} /> Explorar
        </NavLink>
        <NavLink to="/new-post" className={base} activeClassName={active}>
          <PlusSquare size={20} /> Novo Post
        </NavLink>
        <NavLink to="/notifications" className={base} activeClassName={active}>
          <Bell size={20} /> Notificações
        </NavLink>
        <NavLink to={`/profile/${user?.id}`} className={base} activeClassName={active}>
          <User size={20} /> Perfil
        </NavLink>
      </nav>

      <button
        onClick={signOut}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut size={20} /> Sair
      </button>
    </aside>
  );
}
