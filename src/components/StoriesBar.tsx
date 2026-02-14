import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StoryGroup {
  user_id: string;
  name: string;
  avatar_url: string | null;
  stories: { id: string; image_url: string; created_at: string }[];
}

export default function StoriesBar() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStories = async () => {
    const { data } = await supabase
      .from("stories")
      .select("*, profiles:user_id(name, avatar_url)")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    if (!data) return;

    const map = new Map<string, StoryGroup>();
    for (const s of data) {
      const profile = s.profiles as any;
      if (!map.has(s.user_id)) {
        map.set(s.user_id, {
          user_id: s.user_id,
          name: profile?.name || "Usuário",
          avatar_url: profile?.avatar_url,
          stories: [],
        });
      }
      map.get(s.user_id)!.stories.push({
        id: s.id,
        image_url: s.image_url,
        created_at: s.created_at,
      });
    }
    setGroups(Array.from(map.values()));
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleAddStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("stories").upload(path, file);
    if (uploadErr) {
      toast.error("Erro ao enviar story");
      return;
    }
    const { data: urlData } = supabase.storage.from("stories").getPublicUrl(path);
    const { error } = await supabase.from("stories").insert({
      user_id: user.id,
      image_url: urlData.publicUrl,
    });
    if (error) {
      toast.error("Erro ao criar story");
    } else {
      toast.success("Story publicado!");
      fetchStories();
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const openStory = (group: StoryGroup) => {
    setViewingGroup(group);
    setViewingIndex(0);
    setProgress(0);
  };

  useEffect(() => {
    if (!viewingGroup) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          // next story
          if (viewingIndex < viewingGroup.stories.length - 1) {
            setViewingIndex((i) => i + 1);
          } else {
            setViewingGroup(null);
          }
          return 0;
        }
        return p + 2;
      });
    }, 100);
    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [viewingGroup, viewingIndex]);

  const closeStory = () => {
    setViewingGroup(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const nextStory = () => {
    if (!viewingGroup) return;
    if (viewingIndex < viewingGroup.stories.length - 1) {
      setViewingIndex((i) => i + 1);
      setProgress(0);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (viewingIndex > 0) {
      setViewingIndex((i) => i - 1);
      setProgress(0);
    }
  };

  const hasOwnStory = groups.some((g) => g.user_id === user?.id);

  return (
    <>
      <div className="relative">
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-hide">
          {/* Add story button */}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className={cn(
              "relative h-16 w-16 rounded-full flex items-center justify-center",
              hasOwnStory ? "bg-gradient-to-br from-primary to-secondary p-[2px]" : "border-2 border-dashed border-muted-foreground/40"
            )}>
              {hasOwnStory ? (
                <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
                  <Plus size={20} className="text-primary" />
                </div>
              ) : (
                <Plus size={20} className="text-muted-foreground" />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground w-16 text-center truncate">Seu story</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAddStory} />

          {/* Story circles */}
          {groups.filter(g => g.user_id !== user?.id).map((group) => (
            <button
              key={group.user_id}
              onClick={() => openStory(group)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
                <Avatar className="h-full w-full border-2 border-card">
                  <AvatarImage src={group.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-xs">
                    {group.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[10px] text-foreground w-16 text-center truncate">{group.name.split(" ")[0]}</span>
            </button>
          ))}

          {/* Own stories at start if exists */}
          {hasOwnStory && (
            <button
              onClick={() => openStory(groups.find(g => g.user_id === user?.id)!)}
              className="flex flex-col items-center gap-1 flex-shrink-0 order-first ml-0"
              style={{ order: 1 }}
            >
              {/* already shown via Add button */}
            </button>
          )}
        </div>
      </div>

      {/* Story Viewer - fullscreen overlay */}
      {viewingGroup && viewingGroup.stories[viewingIndex] && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          {/* Progress bars */}
          <div className="flex gap-1 px-3 pt-3">
            {viewingGroup.stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{
                    width: i < viewingIndex ? "100%" : i === viewingIndex ? `${progress}%` : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={viewingGroup.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {viewingGroup.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-white text-sm font-semibold flex-1">{viewingGroup.name}</span>
            <button onClick={closeStory} className="text-white">
              <X size={24} />
            </button>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center relative">
            <img
              src={viewingGroup.stories[viewingIndex].image_url}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
            {/* Touch areas */}
            <button
              onClick={prevStory}
              className="absolute left-0 top-0 h-full w-1/3"
              aria-label="Previous"
            />
            <button
              onClick={nextStory}
              className="absolute right-0 top-0 h-full w-2/3"
              aria-label="Next"
            />
          </div>
        </div>
      )}
    </>
  );
}
