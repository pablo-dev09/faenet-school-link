import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, MapPin, BookOpen } from "lucide-react";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.id === id;

  const fetchData = async () => {
    if (!id) return;

    const [profileRes, postsRes, followersRes, followingRes, isFollowingRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", id).maybeSingle(),
      supabase.from("posts").select("*, profiles:user_id(name, avatar_url), likes(user_id), comments(id)").eq("user_id", id).order("created_at", { ascending: false }),
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
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <p className="text-center py-16 text-muted-foreground">Perfil nao encontrado.</p>
      </AppLayout>
    );
  }

  const name = profile.name || "Usuario";

  return (
    <AppLayout>
      {/* Cover */}
      <div className="relative -mx-4 -mt-4 h-32 sm:h-40 bg-gradient-to-br from-primary/80 to-secondary/60 overflow-hidden">
        {profile.cover_url && (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Avatar + Info */}
      <div className="relative -mt-14 flex flex-col items-center animate-fade-in">
        <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <h1 className="mt-3 text-xl font-bold text-balance text-center">{name}</h1>

        {profile.class_course && (
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <BookOpen size={13} />
            <span>{profile.class_course}</span>
          </div>
        )}

        {profile.bio && (
          <p className="mt-2 text-sm text-center max-w-xs leading-relaxed text-muted-foreground">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="mt-5 flex gap-8 text-center">
          <div>
            <p className="text-lg font-bold tabular-nums">{posts.length}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Posts</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{followersCount}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Seguidores</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{followingCount}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Seguindo</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4">
          {isOwner ? (
            <Button variant="outline" size="sm" className="rounded-full gap-1.5 px-4" asChild>
              <Link to="/edit-profile">
                <Settings size={14} /> Editar perfil
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              onClick={toggleFollow}
              className="rounded-full px-6 font-semibold"
            >
              {isFollowing ? "Seguindo" : "Seguir"}
            </Button>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="mt-8 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground px-1">Posts</h2>
        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum post ainda.</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <div key={post.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <PostCard post={post} onUpdate={fetchData} />
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
