/**
 * TRASHit Supabase Storage Buckets
 * 
 * Execute this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
 * Creates private buckets for sensitive files
 */

-- ─── 1. ID Documents Bucket ─────────────────────────────────────────────────
-- Private bucket for provider ID photos (not publicly accessible)

INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Providers can upload their own ID documents
CREATE POLICY "Providers can upload own ID documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'id-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Providers can view their own ID documents
CREATE POLICY "Providers can view own ID documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'id-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Admins can view all ID documents
CREATE POLICY "Admins can view all ID documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'id-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ─── 2. Request Photos Bucket ──────────────────────────────────────────────
-- Private bucket for request photos

INSERT INTO storage.buckets (id, name, public)
VALUES ('request-photos', 'request-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Customers can upload photos for their requests
CREATE POLICY "Customers can upload request photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'request-photos'
  AND auth.uid() IS NOT NULL
);

-- RLS Policy: Users can view photos for requests they're involved in
CREATE POLICY "Users can view request photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'request-photos'
  AND auth.uid() IS NOT NULL
);
