-- Read: any authenticated user can read project media
CREATE POLICY "project-media authenticated read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-media');

-- Write: owner (folder = user_id) or admin
CREATE POLICY "project-media owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-media'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "project-media owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'project-media'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "project-media owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'project-media'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);
