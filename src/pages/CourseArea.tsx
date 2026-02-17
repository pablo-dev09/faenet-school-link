import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { slugToCourse } from "@/lib/constants";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Megaphone, BookOpen, HelpCircle, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CourseArea() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const course = slug ? slugToCourse(slug) : undefined;

  const [profile, setProfile] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New announcement form
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  // New forum post form
  const [forumTitle, setForumTitle] = useState("");
  const [forumContent, setForumContent] = useState("");
  // New summary form
  const [sumTitle, setSumTitle] = useState("");
  const [sumContent, setSumContent] = useState("");

  useEffect(() => {
    if (!user || !course) return;
    const fetchAll = async () => {
      const [profileRes, annRes, forumRes, sumRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("course_announcements").select("*, profiles:user_id(name, avatar_url, account_type)").eq("course", course).order("created_at", { ascending: false }),
        supabase.from("course_forum_posts").select("*, profiles:user_id(name, avatar_url, account_type), course_forum_replies(id)").eq("course", course).order("created_at", { ascending: false }),
        supabase.from("course_summaries").select("*, profiles:user_id(name, avatar_url)").eq("course", course).order("created_at", { ascending: false }),
      ]);
      setProfile(profileRes.data);
      setAnnouncements(annRes.data || []);
      setForumPosts(forumRes.data || []);
      setSummaries(sumRes.data || []);
      setLoading(false);
    };
    fetchAll();
  }, [user, course]);

  // Restrict: user must belong to this course (or be admin)
  useEffect(() => {
    if (!loading && profile && profile.class_course !== course) {
      toast.error("Você não tem acesso a este curso.");
      navigate("/");
    }
  }, [loading, profile, course]);

  if (!course) {
    return <AppLayout><p className="text-center py-12 text-muted-foreground">Curso não encontrado.</p></AppLayout>;
  }

  const isProfessor = profile?.account_type === "professor";

  const postAnnouncement = async () => {
    if (!user || !annTitle.trim() || !annContent.trim()) return;
    const { error } = await supabase.from("course_announcements").insert({
      user_id: user.id, course, title: annTitle.trim(), content: annContent.trim(),
    });
    if (error) { toast.error("Erro ao publicar aviso"); return; }
    toast.success("Aviso publicado!");
    setAnnTitle(""); setAnnContent("");
    const { data } = await supabase.from("course_announcements").select("*, profiles:user_id(name, avatar_url, account_type)").eq("course", course).order("created_at", { ascending: false });
    setAnnouncements(data || []);
  };

  const postForumQuestion = async () => {
    if (!user || !forumTitle.trim() || !forumContent.trim()) return;
    const { error } = await supabase.from("course_forum_posts").insert({
      user_id: user.id, course, title: forumTitle.trim(), content: forumContent.trim(),
    });
    if (error) { toast.error("Erro ao publicar dúvida"); return; }
    toast.success("Dúvida publicada!");
    setForumTitle(""); setForumContent("");
    const { data } = await supabase.from("course_forum_posts").select("*, profiles:user_id(name, avatar_url, account_type), course_forum_replies(id)").eq("course", course).order("created_at", { ascending: false });
    setForumPosts(data || []);
  };

  const postSummary = async () => {
    if (!user || !sumTitle.trim()) return;
    const { error } = await supabase.from("course_summaries").insert({
      user_id: user.id, course, title: sumTitle.trim(), content: sumContent.trim() || null,
    });
    if (error) { toast.error("Erro ao compartilhar resumo"); return; }
    toast.success("Resumo compartilhado!");
    setSumTitle(""); setSumContent("");
    const { data } = await supabase.from("course_summaries").select("*, profiles:user_id(name, avatar_url)").eq("course", course).order("created_at", { ascending: false });
    setSummaries(data || []);
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

  return (
    <AppLayout noPadding>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigate(-1)} className="text-foreground"><ArrowLeft size={22} /></button>
        <div>
          <h1 className="font-bold text-sm">{course}</h1>
          <p className="text-xs text-muted-foreground">Área do curso</p>
        </div>
      </div>

      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-card px-2 h-auto py-0">
          <TabsTrigger value="announcements" className="gap-1.5 text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3">
            <Megaphone size={14} /> Avisos
          </TabsTrigger>
          <TabsTrigger value="forum" className="gap-1.5 text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3">
            <HelpCircle size={14} /> Fórum
          </TabsTrigger>
          <TabsTrigger value="summaries" className="gap-1.5 text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3">
            <BookOpen size={14} /> Resumos
          </TabsTrigger>
        </TabsList>

        {/* Announcements */}
        <TabsContent value="announcements" className="mt-0">
          {isProfessor && (
            <div className="p-4 border-b border-border bg-card space-y-2">
              <Input placeholder="Título do aviso" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} className="text-sm" />
              <Textarea placeholder="Conteúdo do aviso..." value={annContent} onChange={(e) => setAnnContent(e.target.value)} rows={3} className="text-sm resize-none" />
              <Button size="sm" onClick={postAnnouncement} disabled={!annTitle.trim() || !annContent.trim()}>
                <Send size={14} className="mr-1" /> Publicar aviso
              </Button>
            </div>
          )}
          <div className="divide-y divide-border">
            {announcements.length === 0 ? (
              <p className="text-center py-12 text-sm text-muted-foreground">Nenhum aviso publicado.</p>
            ) : announcements.map((a) => (
              <div key={a.id} className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={a.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">{(a.profiles?.name || "P").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold">{a.profiles?.name}</span>
                  {a.profiles?.account_type === "professor" && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                      <CheckCircle size={10} /> Professor
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <h3 className="text-sm font-bold">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.content}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Forum */}
        <TabsContent value="forum" className="mt-0">
          <div className="p-4 border-b border-border bg-card space-y-2">
            <Input placeholder="Título da dúvida" value={forumTitle} onChange={(e) => setForumTitle(e.target.value)} className="text-sm" />
            <Textarea placeholder="Descreva sua dúvida..." value={forumContent} onChange={(e) => setForumContent(e.target.value)} rows={3} className="text-sm resize-none" />
            <Button size="sm" onClick={postForumQuestion} disabled={!forumTitle.trim() || !forumContent.trim()}>
              <Send size={14} className="mr-1" /> Publicar dúvida
            </Button>
          </div>
          <div className="divide-y divide-border">
            {forumPosts.length === 0 ? (
              <p className="text-center py-12 text-sm text-muted-foreground">Nenhuma dúvida publicada.</p>
            ) : forumPosts.map((fp) => (
              <div key={fp.id} className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={fp.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">{(fp.profiles?.name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold">{fp.profiles?.name}</span>
                  {fp.profiles?.account_type === "professor" && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                      <CheckCircle size={10} /> Professor
                    </Badge>
                  )}
                </div>
                <h3 className="text-sm font-bold">{fp.title}</h3>
                <p className="text-sm text-muted-foreground">{fp.content}</p>
                <p className="text-xs text-muted-foreground">
                  {fp.course_forum_replies?.length || 0} respostas · {formatDistanceToNow(new Date(fp.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Summaries */}
        <TabsContent value="summaries" className="mt-0">
          <div className="p-4 border-b border-border bg-card space-y-2">
            <Input placeholder="Título do resumo" value={sumTitle} onChange={(e) => setSumTitle(e.target.value)} className="text-sm" />
            <Textarea placeholder="Conteúdo do resumo..." value={sumContent} onChange={(e) => setSumContent(e.target.value)} rows={3} className="text-sm resize-none" />
            <Button size="sm" onClick={postSummary} disabled={!sumTitle.trim()}>
              <Send size={14} className="mr-1" /> Compartilhar resumo
            </Button>
          </div>
          <div className="divide-y divide-border">
            {summaries.length === 0 ? (
              <p className="text-center py-12 text-sm text-muted-foreground">Nenhum resumo compartilhado.</p>
            ) : summaries.map((s) => (
              <div key={s.id} className="p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={s.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">{(s.profiles?.name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold">{s.profiles?.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <h3 className="text-sm font-bold">{s.title}</h3>
                {s.content && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.content}</p>}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
