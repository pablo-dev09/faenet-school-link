import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import PostCard from "@/components/PostCard";
import logo from "@/assets/logo.png";

export default function Index() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles:user_id(name, avatar_url), likes(user_id), comments(id)")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <AppLayout>
      {/* Mobile header */}
      <div className="flex items-center justify-center pb-4 md:hidden">
        <img src={logo} alt="FaeNet" className="h-8 w-auto" />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">Nenhum post ainda.</p>
            <p className="text-sm text-muted-foreground">Seja o primeiro a postar!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))
        )}
      </div>
    </AppLayout>
  );
}
