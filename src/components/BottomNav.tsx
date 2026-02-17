import { Home, Search, PlusSquare, GraduationCap, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { courseToSlug } from "@/lib/constants";

export default function BottomNav() {
  const { user } = useAuth();
  const [course, setCourse] = useState<string | null>(null);
  const base = "flex flex-col items-center gap-0.5 text-xs text-muted-foreground transition-colors";
  const active = "text-primary";

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("class_course").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setCourse(data?.class_course || null);
    });
  }, [user]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden">
      <div className="flex items-center justify-around py-2">
        <NavLink to="/" className={base} activeClassName={active}>
          <Home size={22} />
          <span>Início</span>
        </NavLink>
        <NavLink to="/explore" className={base} activeClassName={active}>
          <Search size={22} />
          <span>Buscar</span>
        </NavLink>
        <NavLink to="/new-post" className={base} activeClassName={active}>
          <PlusSquare size={22} />
          <span>Postar</span>
        </NavLink>
        {course && (
          <NavLink to={`/course/${courseToSlug(course)}`} className={base} activeClassName={active}>
            <GraduationCap size={22} />
            <span>Curso</span>
          </NavLink>
        )}
        <NavLink to={`/profile/${user?.id}`} className={base} activeClassName={active}>
          <User size={22} />
          <span>Perfil</span>
        </NavLink>
      </div>
    </nav>
  );
}
