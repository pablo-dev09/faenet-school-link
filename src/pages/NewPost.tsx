import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, ArrowLeft } from "lucide-react";
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
    <AppLayout noPadding>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold">Novo Post</h1>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !imageFile)}
          className="text-sm"
        >
          {loading ? "..." : "Compartilhar"}
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {preview && (
          <div className="relative">
            <img src={preview} alt="" className="w-full rounded-lg aspect-square object-cover" />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <Textarea
          placeholder="Escreva uma legenda..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="resize-none border-0 bg-transparent focus-visible:ring-0 text-sm"
        />

        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 text-sm text-primary font-medium"
        >
          <ImagePlus size={20} />
          {preview ? "Trocar foto" : "Adicionar foto"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
      </div>
    </AppLayout>
  );
}
