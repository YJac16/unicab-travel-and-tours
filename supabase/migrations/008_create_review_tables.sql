-- =========================================
-- Reviews Tables + RLS (Supabase Safe)
-- =========================================

-- DRIVER REVIEWS
CREATE TABLE IF NOT EXISTS driver_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TOUR REVIEWS
CREATE TABLE IF NOT EXISTS tour_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_driver_reviews_driver_id ON driver_reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_user_id ON driver_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_approved ON driver_reviews(approved);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_booking_id ON driver_reviews(booking_id);

CREATE INDEX IF NOT EXISTS idx_tour_reviews_tour_id ON tour_reviews(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_user_id ON tour_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_approved ON tour_reviews(approved);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_booking_id ON tour_reviews(booking_id);

-- Prevent duplicate reviews per booking
CREATE UNIQUE INDEX IF NOT EXISTS unique_driver_review_per_booking
ON driver_reviews (booking_id)
WHERE booking_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_tour_review_per_booking
ON tour_reviews (booking_id)
WHERE booking_id IS NOT NULL;

-- ENABLE RLS
ALTER TABLE driver_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_reviews ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS POLICIES (idempotent)
-- =====================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='driver_reviews' AND policyname='Users insert own driver review') THEN
    CREATE POLICY "Users insert own driver review" ON driver_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.user_id = auth.uid()
    ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='driver_reviews' AND policyname='Public read approved driver reviews') THEN
    CREATE POLICY "Public read approved driver reviews" ON driver_reviews FOR SELECT USING (approved = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='driver_reviews' AND policyname='No user updates driver reviews') THEN
    CREATE POLICY "No user updates driver reviews" ON driver_reviews FOR UPDATE USING (false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='driver_reviews' AND policyname='No user deletes driver reviews') THEN
    CREATE POLICY "No user deletes driver reviews" ON driver_reviews FOR DELETE USING (false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='driver_reviews' AND policyname='Admins full access driver reviews') THEN
    CREATE POLICY "Admins full access driver reviews" ON driver_reviews FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tour_reviews' AND policyname='Users insert own tour review') THEN
    CREATE POLICY "Users insert own tour review" ON tour_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.user_id = auth.uid()
    ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tour_reviews' AND policyname='Public read approved tour reviews') THEN
    CREATE POLICY "Public read approved tour reviews" ON tour_reviews FOR SELECT USING (approved = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tour_reviews' AND policyname='No user updates tour reviews') THEN
    CREATE POLICY "No user updates tour reviews" ON tour_reviews FOR UPDATE USING (false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tour_reviews' AND policyname='No user deletes tour reviews') THEN
    CREATE POLICY "No user deletes tour reviews" ON tour_reviews FOR DELETE USING (false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tour_reviews' AND policyname='Admins full access tour reviews') THEN
    CREATE POLICY "Admins full access tour reviews" ON tour_reviews FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;
