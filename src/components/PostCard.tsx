import { useState } from "react";
import { Heart, MessageCircle, Trash2, Send, Bookmark, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    profiles: { name: string; avatar_url: string | null; account_type?: string } | null;
    likes: { user_id: string }[];
    comments: { id: string }[];
  };
  onUpdate: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const [liking, setLiking] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
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

  const handleDoubleTap = async () => {
    if (!user || isLiked) return;
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    if (!liking) {
      setLiking(true);
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
      onUpdate();
      setLiking(false);
    }
  };

  const deletePost = async () => {
    if (!isOwner) return;
    await supabase.from("posts").delete().eq("id", post.id);
    onUpdate();
  };

  return (
    <div className="border-b border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to={`/profile/${post.user_id}`}>
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src={post.profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <Link to={`/profile/${post.user_id}`} className="text-sm font-semibold hover:opacity-70 transition-opacity">
            {authorName}
          </Link>
          {post.profiles?.account_type === "professor" && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5 shrink-0">
              <CheckCircle size={10} /> Professor
            </Badge>
          )}
        </div>
        {isOwner && (
          <button onClick={deletePost} className="text-muted-foreground hover:text-destructive transition-colors p-1">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <div
          className="relative w-full aspect-square bg-muted cursor-pointer"
          onDoubleClick={handleDoubleTap}
        >
          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
          {/* Heart animation on double tap */}
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-300">
              <Heart size={80} className="fill-white text-white drop-shadow-lg" />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center px-4 py-2">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={toggleLike} className="transition-transform active:scale-125">
            <Heart
              size={24}
              className={cn(
                "transition-all",
                isLiked ? "fill-red-500 text-red-500" : "text-foreground hover:text-muted-foreground"
              )}
            />
          </button>
          <Link to={`/post/${post.id}`} className="text-foreground hover:text-muted-foreground transition-colors">
            <MessageCircle size={24} />
          </Link>
          <button className="text-foreground hover:text-muted-foreground transition-colors">
            <Send size={22} />
          </button>
        </div>
        <button className="text-foreground hover:text-muted-foreground transition-colors">
          <Bookmark size={24} />
        </button>
      </div>

      {/* Like count */}
      {(post.likes?.length || 0) > 0 && (
        <p className="px-4 text-sm font-semibold">
          {post.likes.length} {post.likes.length === 1 ? "curtida" : "curtidas"}
        </p>
      )}

      {/* Content */}
      {post.content && (
        <p className="px-4 text-sm leading-relaxed">
          <Link to={`/profile/${post.user_id}`} className="font-semibold mr-1.5">
            {authorName}
          </Link>
          {post.content}
        </p>
      )}

      {/* Comments count */}
      {(post.comments?.length || 0) > 0 && (
        <Link to={`/post/${post.id}`} className="block px-4 pt-1 text-sm text-muted-foreground">
          Ver {post.comments.length === 1 ? "1 comentário" : `todos os ${post.comments.length} comentários`}
        </Link>
      )}

      {/* Time */}
      <p className="px-4 pt-1 pb-3 text-[10px] text-muted-foreground uppercase">
        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
      </p>
    </div>
  );
}
