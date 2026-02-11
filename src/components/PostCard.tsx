import { useState } from "react";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    user_id: string;
    profiles: { name: string; avatar_url: string | null } | null;
    likes: { user_id: string }[];
    comments: { id: string }[];
  };
  onUpdate: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const [liking, setLiking] = useState(false);
  const isLiked = post.likes?.some((l) => l.user_id === user?.id);
  const isOwner = user?.id === post.user_id;
  const authorName = post.profiles?.name || "Usuário";

  const toggleLike = async () => {
    if (!user || liking) return;
    setLiking(true);
    if (isLiked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
    }
    onUpdate();
    setLiking(false);
  };

  const deletePost = async () => {
    if (!isOwner) return;
    await supabase.from("posts").delete().eq("id", post.id);
    onUpdate();
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <Link to={`/profile/${post.user_id}`}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={post.profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link to={`/profile/${post.user_id}`} className="text-sm font-semibold hover:underline">
            {authorName}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
        {isOwner && (
          <button onClick={deletePost} className="text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full object-cover max-h-96" />
      )}

      {/* Content */}
      {post.content && (
        <p className="px-3 py-2 text-sm leading-relaxed">{post.content}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-3 py-2 border-t">
        <button onClick={toggleLike} className="flex items-center gap-1.5 text-sm transition-colors">
          <Heart
            size={20}
            className={cn(
              "transition-all",
              isLiked ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground hover:text-red-500"
            )}
          />
          <span className="text-muted-foreground">{post.likes?.length || 0}</span>
        </button>
        <Link to={`/post/${post.id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle size={20} />
          <span>{post.comments?.length || 0}</span>
        </Link>
      </div>
    </div>
  );
}
