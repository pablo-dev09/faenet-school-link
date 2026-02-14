import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Heart, ArrowLeft, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
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
    setComments(data || []);
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const isLiked = post?.likes?.some((l: any) => l.user_id === user?.id);

  const toggleLike = async () => {
    if (!user || !post) return;
    if (isLiked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
    }
    fetchPost();
  };

  const sendComment = async () => {
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <p className="text-center py-12 text-muted-foreground">Post não encontrado.</p>
      </AppLayout>
    );
  }

  const authorName = post.profiles?.name || "Usuário";

  return (
    <AppLayout noPadding>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Link to="/" className="text-foreground">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-semibold">Comentários</h1>
      </div>

      {/* Post image */}
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full aspect-square object-cover" />
      )}

      {/* Post info */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <Link to={`/profile/${post.user_id}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                {authorName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <p className="text-sm">
              <Link to={`/profile/${post.user_id}`} className="font-semibold mr-1.5">{authorName}</Link>
              {post.content}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
          <button onClick={toggleLike}>
            <Heart size={16} className={cn(isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </button>
        </div>
        <p className="text-sm font-semibold">{post.likes?.length || 0} curtidas</p>
      </div>

      {/* Comments */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Link to={`/profile/${c.user_id}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={c.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-[10px]">
                  {(c.profiles?.name || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <p className="text-sm">
                <Link to={`/profile/${c.user_id}`} className="font-semibold mr-1.5">{c.profiles?.name || "Usuário"}</Link>
                {c.content}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input */}
      <div className="sticky bottom-14 md:bottom-0 border-t border-border bg-card px-4 py-3 flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">EU</AvatarFallback>
        </Avatar>
        <Input
          placeholder="Adicione um comentário..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendComment()}
          className="border-0 bg-transparent text-sm px-0 focus-visible:ring-0"
        />
        <button
          onClick={sendComment}
          disabled={!commentText.trim() || sending}
          className="text-primary font-semibold text-sm disabled:opacity-40"
        >
          Publicar
        </button>
      </div>
    </AppLayout>
  );
}
