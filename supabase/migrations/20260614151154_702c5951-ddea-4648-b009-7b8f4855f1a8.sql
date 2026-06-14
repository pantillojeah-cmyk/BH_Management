
-- Public read of boarding house photos (so visitors can see listings)
CREATE POLICY "bh_photos_public_read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'boarding-house-photos');

-- Owners and admins can upload to their own folder (path: <user_id>/<filename>)
CREATE POLICY "bh_photos_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'boarding-house-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "bh_photos_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'boarding-house-photos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "bh_photos_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'boarding-house-photos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );
