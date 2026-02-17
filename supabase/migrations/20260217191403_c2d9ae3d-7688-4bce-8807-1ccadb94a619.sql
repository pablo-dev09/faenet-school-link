
-- Create account type enum
CREATE TYPE public.account_type AS ENUM ('professor', 'aluno');

-- Add account_type column to profiles
ALTER TABLE public.profiles ADD COLUMN account_type public.account_type NOT NULL DEFAULT 'aluno';

-- Create app_role enum for admin system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Course announcements table (professors only)
CREATE TABLE public.course_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view announcements" ON public.course_announcements
  FOR SELECT USING (true);

CREATE POLICY "Professors can create announcements" ON public.course_announcements
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.account_type = 'professor'
    )
  );

CREATE POLICY "Professors can delete own announcements" ON public.course_announcements
  FOR DELETE USING (auth.uid() = user_id);

-- Course forum posts
CREATE TABLE public.course_forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view forum posts" ON public.course_forum_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create forum posts" ON public.course_forum_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own forum posts" ON public.course_forum_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Course forum replies
CREATE TABLE public.course_forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.course_forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view forum replies" ON public.course_forum_replies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create forum replies" ON public.course_forum_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own forum replies" ON public.course_forum_replies
  FOR DELETE USING (auth.uid() = user_id);

-- Course summaries (shared study materials)
CREATE TABLE public.course_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course text NOT NULL,
  title text NOT NULL,
  content text,
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view summaries" ON public.course_summaries
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create summaries" ON public.course_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own summaries" ON public.course_summaries
  FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for summaries
INSERT INTO storage.buckets (id, name, public) VALUES ('summaries', 'summaries', true);

CREATE POLICY "Anyone can view summaries files" ON storage.objects
  FOR SELECT USING (bucket_id = 'summaries');

CREATE POLICY "Authenticated users can upload summaries" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'summaries' AND auth.uid() IS NOT NULL);
