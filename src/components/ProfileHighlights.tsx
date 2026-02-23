import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Highlight {
  id: string;
  title: string;
  cover_url: string | null;
  user_id: string;
  items: { id: string; image_url: string }[];
}

interface Props {
  profileUserId: string;
  isOwner: boolean;
}

export default function ProfileHighlights({ profileUserId, isOwner }: Props) {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [viewing, setViewing] = useState<Highlight | null>(null);
  const [viewIdx, setViewIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHighlights = async () => {
    const { data } = await supabase
      .from("highlights")
      .select("*, highlight_items(*)")
      .eq("user_id", profileUserId)
      .order("created_at", { ascending: true });
    if (data) {
      setHighlights(
        data.map((h: any) => ({
          ...h,
          items: (h.highlight_items || []).sort(
            (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ),
        }))
      );
    }
  };

  useEffect(() => {
    fetchHighlights();
  }, [profileUserId]);

  const handleCreate = async () => {
    if (!user || !newTitle.trim() || newFiles.length === 0) return;
    setCreating(true);

    // Upload images
    const imageUrls: string[] = [];
    for (const file of newFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("highlights").upload(path, file);
      if (error) {
        toast.error("Erro ao enviar imagem");
        setCreating(false);
        return;
      }
      const { data } = supabase.storage.from("highlights").getPublicUrl(path);
      imageUrls.push(data.publicUrl);
    }

    // Create highlight
    const { data: highlight, error: hError } = await supabase
      .from("highlights")
      .insert({ user_id: user.id, title: newTitle.trim(), cover_url: imageUrls[0] })
      .select()
      .single();

    if (hError || !highlight) {
      toast.error("Erro ao criar destaque");
      setCreating(false);
      return;
    }

    // Add items
    const items = imageUrls.map((url) => ({
      highlight_id: highlight.id,
      image_url: url,
    }));
    await supabase.from("highlight_items").insert(items);

    toast.success("Destaque criado!");
    setNewTitle("");
    setNewFiles([]);
    setShowCreate(false);
    setCreating(false);
    fetchHighlights();
  };

  const deleteHighlight = async (id: string) => {
    await supabase.from("highlights").delete().eq("id", id);
    toast.success("Destaque removido");
    setViewing(null);
    fetchHighlights();
  };

  // Viewer logic
  const openHighlight = (h: Highlight) => {
    if (h.items.length === 0) return;
    setViewing(h);
    setViewIdx(0);
    setProgress(0);
  };

  useEffect(() => {
    if (!viewing) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          if (viewIdx < viewing.items.length - 1) {
            setViewIdx((i) => i + 1);
          } else {
            setViewing(null);
          }
          return 0;
        }
        return p + 2;
      });
    }, 100);
    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [viewing, viewIdx]);

  const closeViewer = () => {
    setViewing(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(Array.from(e.target.files));
    }
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto py-3 px-4 scrollbar-hide">
        {/* Create button (owner only) */}
        {isOwner && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center">
                  <Plus size={20} className="text-muted-foreground" />
                </div>
                <span className="text-[10px] text-muted-foreground w-16 text-center truncate">Novo</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Destaque</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nome do destaque"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <div>
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    {newFiles.length > 0 ? `${newFiles.length} foto(s)` : "Selecionar fotos"}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFilesChange}
                  />
                </div>
                <Button onClick={handleCreate} disabled={creating || !newTitle.trim() || newFiles.length === 0} className="w-full">
                  {creating ? "Criando..." : "Criar destaque"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Highlight circles */}
        {highlights.map((h) => (
          <button
            key={h.id}
            onClick={() => openHighlight(h)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
              <div className="h-full w-full rounded-full border-2 border-card overflow-hidden bg-muted">
                {h.cover_url && (
                  <img src={h.cover_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
            <span className="text-[10px] text-foreground w-16 text-center truncate">{h.title}</span>
          </button>
        ))}
      </div>

      {/* Fullscreen viewer */}
      {viewing && viewing.items[viewIdx] && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          {/* Progress */}
          <div className="flex gap-1 px-3 pt-3">
            {viewing.items.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{ width: i < viewIdx ? "100%" : i === viewIdx ? `${progress}%` : "0%" }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="text-white text-sm font-semibold flex-1">{viewing.title}</span>
            {isOwner && (
              <button onClick={() => deleteHighlight(viewing.id)} className="text-white/70 mr-2">
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={closeViewer} className="text-white">
              <X size={24} />
            </button>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center relative">
            <img src={viewing.items[viewIdx].image_url} alt="" className="max-h-full max-w-full object-contain" />
            <button
              onClick={() => { if (viewIdx > 0) { setViewIdx(i => i - 1); setProgress(0); } }}
              className="absolute left-0 top-0 h-full w-1/3"
              aria-label="Previous"
            />
            <button
              onClick={() => {
                if (viewIdx < viewing.items.length - 1) {
                  setViewIdx(i => i + 1);
                  setProgress(0);
                } else {
                  closeViewer();
                }
              }}
              className="absolute right-0 top-0 h-full w-2/3"
              aria-label="Next"
            />
          </div>
        </div>
      )}
    </>
  );
}
