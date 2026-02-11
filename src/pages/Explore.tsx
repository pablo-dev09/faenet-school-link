import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function Explore() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearched(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, avatar_url, class_course")
      .ilike("name", `%${q.trim()}%`)
      .limit(20);
    setResults(data || []);
  };

  return (
    <AppLayout>
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {searched && results.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum resultado encontrado.</p>
        )}
        {results.map((p) => (
          <Link
            key={p.user_id}
            to={`/profile/${p.user_id}`}
            className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted transition-colors"
          >
            <Avatar className="h-11 w-11">
              <AvatarImage src={p.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {(p.name || "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{p.name || "Usuário"}</p>
              {p.class_course && <p className="text-xs text-muted-foreground">{p.class_course}</p>}
            </div>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
