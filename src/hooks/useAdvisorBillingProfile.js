import { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';

/**
 * Advisor Pro subscription + trial state (see GET /billing/advisor/profile).
 * @param {boolean} enabled When false, skips fetch.
 */
export function useAdvisorBillingProfile(userId, enabled) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!enabled);

  useEffect(() => {
    if (!enabled) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/billing/advisor/profile`, {
          headers: { 'X-Clerk-User-Id': userId },
        });
        if (cancelled) return;
        if (res.ok) {
          setProfile(await res.json());
        } else {
          setProfile(null);
        }
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, enabled]);

  return { profile, loading };
}

/** Short label for header chip from billing profile. */
export function advisorBillingChipLabel(profile) {
  if (!profile) return 'Advisor';
  const s = profile.effective_status || profile.subscription_status || 'free';
  switch (s) {
    case 'trial':
      return 'Pro Advisor · Trial';
    case 'active':
      return 'Pro Advisor';
    case 'past_due':
      return 'Pro Advisor · Renew';
    case 'cancelled':
      return 'Pro Advisor · Inactive';
    case 'free':
    default:
      return 'Pro Advisor · Free';
  }
}
