import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

export default function NewPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <h1 className="text-lg font-bold mb-4">Novo Post</h1>

      <div className="space-y-4">
        <Textarea
          placeholder="O que está acontecendo?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="resize-none"
        />

        {preview && (
          <div className="relative">
            <img src={preview} alt="" className="w-full rounded-lg max-h-72 object-cover" />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ImagePlus size={20} />
            Adicionar foto
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

          <Button onClick={handleSubmit} disabled={loading || (!content.trim() && !imageFile)}>
            {loading ? "Publicando..." : "Publicar"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
