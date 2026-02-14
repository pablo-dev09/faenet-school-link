import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Grid3X3, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "saved">("posts");

  const isOwner = user?.id === id;

  const fetchData = async () => {
    if (!id) return;

    const [profileRes, postsRes, followersRes, followingRes, isFollowingRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", id).maybeSingle(),
      supabase.from("posts").select("*, likes(user_id), comments(id)").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("follows").select("id", { count: "exact" }).eq("following_id", id),
      supabase.from("follows").select("id", { count: "exact" }).eq("follower_id", id),
      user ? supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    setProfile(profileRes.data);
    setPosts(postsRes.data || []);
    setFollowersCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);
    setIsFollowing(!!isFollowingRes.data);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [id]);

  const toggleFollow = async () => {
    if (!user || !id || isOwner) return;
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
    }
    fetchData();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <p className="text-center py-12 text-muted-foreground">Perfil não encontrado.</p>
      </AppLayout>
    );
  }

  const name = profile.name || "Usuário";

  return (
    <AppLayout noPadding>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-lg font-bold">{name}</h1>
        {isOwner && (
          <Link to="/edit-profile" className="text-foreground">
            <Settings size={22} />
          </Link>
        )}
      </div>

      {/* Profile info */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <Avatar className="h-20 w-20 ring-2 ring-primary/20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Stats */}
          <div className="flex-1 flex justify-around text-center">
            <div>
              <p className="text-lg font-bold">{posts.length}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="text-lg font-bold">{followersCount}</p>
              <p className="text-xs text-muted-foreground">Seguidores</p>
            </div>
            <div>
              <p className="text-lg font-bold">{followingCount}</p>
              <p className="text-xs text-muted-foreground">Seguindo</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-3">
          <p className="text-sm font-semibold">{name}</p>
          {profile.class_course && (
            <p className="text-sm text-muted-foreground">{profile.class_course}</p>
          )}
          {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
        </div>

        {/* Action button */}
        <div className="mt-4">
          {isOwner ? (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/edit-profile">Editar perfil</Link>
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full"
              variant={isFollowing ? "outline" : "default"}
              onClick={toggleFollow}
            >
              {isFollowing ? "Seguindo" : "Seguir"}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-border">
        <button
          onClick={() => setTab("posts")}
          className={cn(
            "flex-1 flex justify-center py-3 border-b-2 transition-colors",
            tab === "posts" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
          )}
        >
          <Grid3X3 size={22} />
        </button>
        <button
          onClick={() => setTab("saved")}
          className={cn(
            "flex-1 flex justify-center py-3 border-b-2 transition-colors",
            tab === "saved" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
          )}
        >
          <Bookmark size={22} />
        </button>
      </div>

      {/* Grid */}
      {tab === "posts" && (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.length === 0 ? (
            <div className="col-span-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">Nenhum post ainda.</p>
            </div>
          ) : (
            posts.map((post) => (
              <Link key={post.id} to={`/post/${post.id}`} className="aspect-square bg-muted relative group">
                {post.image_url ? (
                  <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted p-2">
                    <p className="text-xs text-muted-foreground line-clamp-3 text-center">{post.content}</p>
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-semibold">
                  <span className="flex items-center gap-1">❤️ {post.likes?.length || 0}</span>
                  <span className="flex items-center gap-1">💬 {post.comments?.length || 0}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "saved" && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhum post salvo.</p>
        </div>
      )}
    </AppLayout>
  );
}
