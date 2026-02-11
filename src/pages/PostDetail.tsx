import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Trash2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { name: string; avatar_url: string | null } | null;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchPost = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("posts")
      .select("*, profiles:user_id(name, avatar_url), likes(user_id)")
      .eq("id", id)
      .maybeSingle();
    setPost(data);
    setLoading(false);
  };

  const fetchComments = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("comments")
      .select("*, profiles:user_id(name, avatar_url)")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    setComments((data as Comment[]) || []);
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const toggleLike = async () => {
    if (!user || !post) return;
    const isLiked = post.likes?.some((l: any) => l.user_id === user.id);
    if (isLiked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
    }
    fetchPost();
  };

  const submitComment = async () => {
    if (!user || !id || !commentText.trim()) return;
    setSending(true);
    const { error } = await supabase.from("comments").insert({
      post_id: id,
      user_id: user.id,
      content: commentText.trim(),
    });
    if (error) {
      toast.error("Erro ao comentar");
    } else {
      setCommentText("");
      fetchComments();
    }
    setSending(false);
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    fetchComments();
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

  if (!post) {
    return (
      <AppLayout>
        <p className="text-center py-16 text-muted-foreground">Post nao encontrado.</p>
      </AppLayout>
    );
  }

  const authorName = post.profiles?.name || "Usuario";
  const isLiked = post.likes?.some((l: any) => l.user_id === user?.id);
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR });

  return (
    <AppLayout>
      {/* Back button */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft size={16} />
        Voltar
      </Link>

      {/* Post */}
      <div className="rounded-xl border bg-card overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <Link to={`/profile/${post.user_id}`}>
            <Avatar className="h-11 w-11">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {authorName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link to={`/profile/${post.user_id}`} className="text-sm font-semibold hover:underline">
              {authorName}
            </Link>
            <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <p className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Image */}
        {post.image_url && (
          <img src={post.image_url} alt="" className="w-full object-cover max-h-[500px]" />
        )}

        {/* Like action */}
        <div className="flex items-center gap-4 px-4 py-3 border-t">
          <button
            onClick={toggleLike}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-all",
              isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            )}
          >
            <Heart size={20} className={cn(isLiked && "fill-current scale-110")} />
            <span className="text-xs font-medium tabular-nums">{post.likes?.length || 0}</span>
          </button>
          <span className="text-xs text-muted-foreground">
            {comments.length} {comments.length === 1 ? "comentario" : "comentarios"}
          </span>
        </div>
      </div>

      {/* Comment input */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border bg-card p-3">
        <Avatar className="h-8 w-8 shrink-0 mt-0.5">
          <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
            {(user?.user_metadata?.name || "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <textarea
            placeholder="Escreva um comentario..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitComment();
              }
            }}
            rows={1}
            className="w-full resize-none bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={submitComment}
          disabled={sending || !commentText.trim()}
          className="shrink-0 rounded-full h-8 w-8 p-0"
          aria-label="Enviar comentario"
        >
          <Send size={14} />
        </Button>
      </div>

      {/* Comments list */}
      <div className="mt-3 space-y-2">
        {comments.map((comment, i) => {
          const cName = comment.profiles?.name || "Usuario";
          const cTime = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR });
          const isCommentOwner = user?.id === comment.user_id;

          return (
            <div
              key={comment.id}
              className="rounded-xl border bg-card p-3 animate-slide-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start gap-2.5">
                <Link to={`/profile/${comment.user_id}`}>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-semibold">
                      {cName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/profile/${comment.user_id}`} className="text-xs font-semibold hover:underline">
                      {cName}
                    </Link>
                    <span className="text-[10px] text-muted-foreground">{cTime}</span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed">{comment.content}</p>
                </div>
                {isCommentOwner && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10"
                    aria-label="Excluir comentario"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
