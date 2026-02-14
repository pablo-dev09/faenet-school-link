
-- Add unique constraint on profiles.user_id so we can FK to it
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Add FK from posts.user_id to profiles.user_id
ALTER TABLE public.posts 
  ADD CONSTRAINT posts_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add FK from comments.user_id to profiles.user_id
ALTER TABLE public.comments 
  ADD CONSTRAINT comments_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add FK from comments.post_id to posts.id (already exists but let's be safe)
-- skipping since it already exists per types

-- Add FK from likes.user_id to profiles.user_id
ALTER TABLE public.likes 
  ADD CONSTRAINT likes_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add FK from likes.post_id to posts.id (already exists)
-- skipping

-- Add FK from follows to profiles
ALTER TABLE public.follows 
  ADD CONSTRAINT follows_follower_id_profiles_fkey 
  FOREIGN KEY (follower_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.follows 
  ADD CONSTRAINT follows_following_id_profiles_fkey 
  FOREIGN KEY (following_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Users can create own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Create stories storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true);

CREATE POLICY "Anyone can view story images" ON storage.objects FOR SELECT USING (bucket_id = 'stories');
CREATE POLICY "Users can upload story images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own story images" ON storage.objects FOR DELETE USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);
