
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_admin_if_first() FROM PUBLIC, anon;

-- Storage policies for boarding-house-photos bucket
CREATE POLICY "Authenticated can read boarding photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'boarding-house-photos');

CREATE POLICY "Owners upload boarding photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'boarding-house-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners update their photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'boarding-house-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners delete their photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'boarding-house-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
