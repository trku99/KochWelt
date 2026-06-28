-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('recipe-images', 'recipe-images', true, false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for recipe-images bucket
CREATE POLICY "Anyone can view recipe images"
ON storage.objects FOR SELECT USING (bucket_id = 'recipe-images');

CREATE POLICY "Authenticated users can upload recipe images"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recipe-images' AND auth.role() = 'authenticated');

CREATE POLICY "Owners can update their images"
ON storage.objects FOR UPDATE USING (bucket_id = 'recipe-images' AND auth.role() = 'authenticated');
