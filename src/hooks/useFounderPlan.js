import { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';

export function planIdToLabel(id) {
  if (id === 'PRO') return 'Pro';
  if (id === 'PRO_PLUS') return 'Pro+';
  return 'Free';
}

/**
 * Fetches the signed-in user's founder billing plan (FREE / PRO / PRO_PLUS).
 * @param {boolean} [enabled=true] When false, skips fetch (e.g. on advisor-only screens).
 */
export function useFounderPlan(userId, enabled = true) {
  const [planId, setPlanId] = useState(null);
  const [loading, setLoading] = useState(!!enabled);

  useEffect(() => {
    if (!enabled) {
      setPlanId('FREE');
      setLoading(false);
      return;
    }

    if (!userId) {
      setPlanId('FREE');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/billing/my-plan`, {
          headers: { 'X-Clerk-User-Id': userId },
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setPlanId(data.id || 'FREE');
        } else {
          setPlanId('FREE');
        }
      } catch {
        if (!cancelled) setPlanId('FREE');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, enabled]);

  return { planId: planId || 'FREE', loading };
}
