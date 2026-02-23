
-- Create highlights table for Instagram-like profile highlights
CREATE TABLE public.highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create highlight_items table (stories saved to highlights)
CREATE TABLE public.highlight_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  highlight_id UUID NOT NULL REFERENCES public.highlights(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_items ENABLE ROW LEVEL SECURITY;

-- Highlights policies
CREATE POLICY "Anyone can view highlights" ON public.highlights FOR SELECT USING (true);
CREATE POLICY "Users can create own highlights" ON public.highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own highlights" ON public.highlights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own highlights" ON public.highlights FOR DELETE USING (auth.uid() = user_id);

-- Highlight items policies
CREATE POLICY "Anyone can view highlight items" ON public.highlight_items FOR SELECT USING (true);
CREATE POLICY "Users can add to own highlights" ON public.highlight_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.highlights WHERE id = highlight_id AND user_id = auth.uid()));
CREATE POLICY "Users can remove from own highlights" ON public.highlight_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.highlights WHERE id = highlight_id AND user_id = auth.uid()));

-- Create highlights storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('highlights', 'highlights', true);

-- Storage policies for highlights
CREATE POLICY "Anyone can view highlight images" ON storage.objects FOR SELECT USING (bucket_id = 'highlights');
CREATE POLICY "Users can upload highlight images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'highlights' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete highlight images" ON storage.objects FOR DELETE
  USING (bucket_id = 'highlights' AND (auth.uid())::text = (storage.foldername(name))[1]);
