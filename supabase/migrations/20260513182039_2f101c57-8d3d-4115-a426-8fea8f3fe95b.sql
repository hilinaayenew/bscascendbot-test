
-- Messages: conversation listing & inbox
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON public.messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON public.messages (receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_pair_created ON public.messages (sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON public.messages (receiver_id) WHERE read = false;

-- Bookings: dashboard & calendar lookups
CREATE INDEX IF NOT EXISTS idx_bookings_mentor_date ON public.bookings (mentor_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_booker_date ON public.bookings (booker_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON public.bookings (status, booking_date);

-- Pairings
CREATE INDEX IF NOT EXISTS idx_pairings_mentor_status ON public.pairings (mentor_id, status);
CREATE INDEX IF NOT EXISTS idx_pairings_mentee_status ON public.pairings (mentee_id, status);

-- Mentor availability / blocked dates / settings
CREATE INDEX IF NOT EXISTS idx_mentor_availability_mentor_day ON public.mentor_availability (mentor_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_mentor_blocked_dates_mentor ON public.mentor_blocked_dates (mentor_id, blocked_date);
CREATE INDEX IF NOT EXISTS idx_booking_slots_mentor_start ON public.booking_slots (mentor_id, slot_start, status);

-- Mentor details directory filter
CREATE INDEX IF NOT EXISTS idx_mentor_details_approval ON public.mentor_details (approval_status);

-- Session logs & goals (pairing lookups)
CREATE INDEX IF NOT EXISTS idx_session_logs_pairing ON public.session_logs (pairing_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_session_logs_logged_by ON public.session_logs (logged_by);
CREATE INDEX IF NOT EXISTS idx_goals_pairing ON public.goals (pairing_id);

-- User roles directory filtering by role
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);

-- Course progress lookups
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON public.course_progress (user_id);

-- Discount codes redemption lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_redeemed_by ON public.discount_codes (redeemed_by) WHERE redeemed_by IS NOT NULL;

-- Profiles country/role browsing in Explore
CREATE INDEX IF NOT EXISTS idx_profiles_pathway_level ON public.profiles (pathway_level);

ANALYZE public.messages;
ANALYZE public.bookings;
ANALYZE public.pairings;
ANALYZE public.mentor_availability;
ANALYZE public.mentor_blocked_dates;
ANALYZE public.booking_slots;
ANALYZE public.mentor_details;
ANALYZE public.session_logs;
ANALYZE public.goals;
ANALYZE public.user_roles;
ANALYZE public.course_progress;
ANALYZE public.profiles;
