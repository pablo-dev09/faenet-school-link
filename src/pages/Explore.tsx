import { useState, useEffect } from "react";
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
  const [gridPosts, setGridPosts] = useState<any[]>([]);

  useEffect(() => {
    // Load popular posts for grid
    supabase
      .from("posts")
      .select("id, image_url, content, likes(user_id), comments(id)")
      .not("image_url", "eq", "")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setGridPosts(data || []));
  }, []);

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
    <AppLayout noPadding>
      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-muted border-0 rounded-lg h-9 text-sm"
          />
        </div>
      </div>

      {/* Search results */}
      {searched && (
        <div className="px-4 pb-2">
          {results.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum resultado.</p>
          ) : (
            <div className="space-y-1">
              {results.map((p) => (
                <Link
                  key={p.user_id}
                  to={`/profile/${p.user_id}`}
                  className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted transition-colors"
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
          )}
        </div>
      )}

      {/* Explore grid */}
      {!searched && (
        <div className="grid grid-cols-3 gap-0.5">
          {gridPosts.map((post, i) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className={`relative bg-muted group ${i % 5 === 2 ? "row-span-2 col-span-1" : ""} aspect-square`}
            >
              {post.image_url ? (
                <img src={post.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted p-2">
                  <p className="text-xs text-muted-foreground line-clamp-3 text-center">{post.content}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-sm font-semibold">
                <span>❤️ {post.likes?.length || 0}</span>
                <span>💬 {post.comments?.length || 0}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
