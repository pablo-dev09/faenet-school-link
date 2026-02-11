import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import logo from "@/assets/logo.png";

export default function Index() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles:user_id(name, avatar_url), likes(user_id), comments(id)")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts(data || []);
    setLoading(false);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile(data);
  };

  useEffect(() => {
    fetchPosts();
    fetchProfile();
  }, [user]);

  return (
    <AppLayout>
      {/* Mobile header */}
      <div className="flex items-center justify-center pb-3 md:hidden">
        <img src={logo} alt="FaeNet" className="h-7 w-auto" />
      </div>

      <div className="space-y-4">
        {/* Inline composer */}
        <CreatePost
          avatarUrl={profile?.avatar_url}
          userName={profile?.name}
          onPostCreated={fetchPosts}
        />

        {/* Posts feed */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-sm font-medium text-foreground">Nenhum post ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">Seja o primeiro a compartilhar algo!</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <div key={post.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <PostCard post={post} onUpdate={fetchPosts} />
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
