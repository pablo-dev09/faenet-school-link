import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Send } from "lucide-react";
import { toast } from "sonner";

interface CreatePostProps {
  avatarUrl?: string | null;
  userName?: string;
  onPostCreated: () => void;
}

export default function CreatePost({ avatarUrl, userName, onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreview(null);
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  const handleSubmit = async () => {
    if (!user || (!content.trim() && !imageFile)) return;
    setLoading(true);

    let image_url = "";
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("posts").upload(path, imageFile);
      if (uploadError) {
        toast.error("Erro ao enviar imagem");
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: content.trim(),
      image_url,
    });

    if (error) {
      toast.error("Erro ao criar post");
    } else {
      toast.success("Post publicado!");
      setContent("");
      setImageFile(null);
      setPreview(null);
      setFocused(false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      onPostCreated();
    }
    setLoading(false);
  };

  const initials = (userName || "U").slice(0, 2).toUpperCase();
  const hasContent = content.trim().length > 0 || !!imageFile;

  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-fade-in">
      <div className="flex gap-3 p-4">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            placeholder="O que esta acontecendo?"
            value={content}
            onFocus={() => setFocused(true)}
            onChange={(e) => {
              setContent(e.target.value);
              autoResize();
            }}
            rows={1}
            className="w-full resize-none bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </div>
      </div>

      {preview && (
        <div className="relative mx-4 mb-3">
          <img src={preview} alt="" className="w-full rounded-lg max-h-64 object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 rounded-full bg-foreground/60 p-1.5 text-background transition-colors hover:bg-foreground/80"
            aria-label="Remover imagem"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {(focused || hasContent) && (
        <div className="flex items-center justify-between border-t px-4 py-2.5 animate-fade-in">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
            aria-label="Adicionar foto"
          >
            <ImagePlus size={18} />
            <span className="hidden sm:inline">Foto</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !hasContent}
            className="gap-1.5 rounded-full px-4 text-xs font-semibold"
          >
            {loading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send size={14} />
            )}
            {loading ? "Publicando..." : "Publicar"}
          </Button>
        </div>
      )}
    </div>
  );
}
