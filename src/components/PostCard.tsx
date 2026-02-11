import { useState } from "react";
import { Heart, MessageCircle, Trash2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  const actualLiked = post.likes?.some((l) => l.user_id === user?.id);
  const isLiked = optimisticLiked !== null ? optimisticLiked : actualLiked;
  const likeCount = optimisticCount !== null ? optimisticCount : (post.likes?.length || 0);
  const isOwner = user?.id === post.user_id;
  const authorName = post.profiles?.name || "Usuario";

  const toggleLike = async () => {
    if (!user || liking) return;
    setLiking(true);

    // Optimistic update
    const newLiked = !isLiked;
    setOptimisticLiked(newLiked);
    setOptimisticCount(newLiked ? likeCount + 1 : likeCount - 1);

    if (actualLiked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
    }

    setOptimisticLiked(null);
    setOptimisticCount(null);
    onUpdate();
    setLiking(false);
  };

  const deletePost = async () => {
    if (!isOwner) return;
    await supabase.from("posts").delete().eq("id", post.id);
    onUpdate();
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR });

  return (
    <div className="rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Link to={`/profile/${post.user_id}`} className="shrink-0">
          <Avatar className="h-10 w-10 transition-transform hover:scale-105">
            <AvatarImage src={post.profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.user_id}`} className="text-sm font-semibold hover:underline leading-tight">
            {authorName}
          </Link>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{timeAgo}</p>
        </div>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Opcoes do post">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={deletePost} className="text-destructive focus:text-destructive">
                <Trash2 size={14} className="mr-2" />
                Excluir post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-2 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Image */}
      {post.image_url && (
        <Link to={`/post/${post.id}`}>
          <img
            src={post.image_url}
            alt=""
            className="w-full object-cover max-h-[420px] cursor-pointer transition-opacity hover:opacity-95"
          />
        </Link>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-t">
        <button
          onClick={toggleLike}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all",
            isLiked
              ? "text-red-500"
              : "text-muted-foreground hover:text-red-500 hover:bg-red-500/5"
          )}
          aria-label={isLiked ? "Descurtir" : "Curtir"}
        >
          <Heart
            size={18}
            className={cn("transition-all", isLiked && "fill-current scale-110")}
          />
          <span className="text-xs font-medium tabular-nums">{likeCount}</span>
        </button>
        <Link
          to={`/post/${post.id}`}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary hover:bg-primary/5"
        >
          <MessageCircle size={18} />
          <span className="text-xs font-medium tabular-nums">{post.comments?.length || 0}</span>
        </Link>
      </div>
    </div>
  );
}
