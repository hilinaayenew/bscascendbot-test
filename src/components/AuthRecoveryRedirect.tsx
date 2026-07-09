import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Catches Supabase password recovery tokens that land on any route other than
 * /reset-password and forwards them — preserving the URL hash — so the
 * dedicated recovery form can complete the flow.
 *
 * Without this, a user clicking the reset link could land on `/` with
 * `#access_token=...&type=recovery`, get silently signed in, and bypass the
 * "set new password" form entirely.
 */
const AuthRecoveryRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("type=recovery")) return;

    // /onboarding is the mentor invite flow — it also handles recovery tokens
    // (forces the mentor to set a password). Don't redirect away from it.
    if (location.pathname !== "/reset-password" && location.pathname !== "/onboarding") {
      // Preserve the hash so Supabase can parse the tokens on /reset-password
      navigate(`/reset-password${hash}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
};

export default AuthRecoveryRedirect;
