import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

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
    <AppLayout>
      {/* Cover */}
      <div className="relative -mx-4 -mt-4 h-36 bg-gradient-to-br from-primary to-accent rounded-b-2xl overflow-hidden">
        {profile.cover_url && (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Avatar + Info */}
      <div className="relative -mt-12 flex flex-col items-center">
        <Avatar className="h-24 w-24 border-4 border-card">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <h1 className="mt-2 text-xl font-bold">{name}</h1>
        {profile.class_course && (
          <p className="text-sm text-muted-foreground">{profile.class_course}</p>
        )}
        {profile.bio && <p className="mt-1 text-sm text-center max-w-xs">{profile.bio}</p>}

        {/* Stats */}
        <div className="mt-4 flex gap-8 text-center">
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

        {/* Actions */}
        <div className="mt-4">
          {isOwner ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/edit-profile">
                <Settings size={16} className="mr-1" /> Editar perfil
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant={isFollowing ? "outline" : "default"} onClick={toggleFollow}>
              {isFollowing ? "Seguindo" : "Seguir"}
            </Button>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="mt-6 space-y-4">
        {posts.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum post ainda.</p>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} onUpdate={fetchData} />)
        )}
      </div>
    </AppLayout>
  );
}
