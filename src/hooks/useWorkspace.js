import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { API_BASE } from '../config/api';
import { useWorkspaceContext } from '../contexts/WorkspaceContext';

export const useWorkspace = (workspaceId) => {
  const { user } = useUser();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWorkspace = useCallback(async () => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch workspace');
      }
      
      const data = await response.json();
      setWorkspace(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, workspaceId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const updateWorkspace = useCallback(async (updates) => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update workspace: ${error}`);
      }
      
      const data = await response.json();
      setWorkspace(data);
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId]);

  return { workspace, loading, error, refetch: fetchWorkspace, updateWorkspace };
};

// Helper to determine if we should use context data
const useContextReady = () => {
  const context = useWorkspaceContext();
  // Use context if: context exists, is not loading, and has no error
  const isReady = context !== null && !context.loading && !context.error;
  return { context, isReady };
};

export const useWorkspaceDecisions = (workspaceId, tag = null) => {
  const { user } = useUser();
  const { context, isReady } = useContextReady();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDecisions = useCallback(async (page = 1, limit = 20) => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit });
      if (tag) params.append('tag', tag);
      
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/decisions?${params}`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch decisions');
      }
      
      const data = await response.json();
      setDecisions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, workspaceId, tag]);

  useEffect(() => {
    // Only fetch if context is not ready (null, loading, or error)
    if (!isReady) {
      fetchDecisions();
    }
  }, [fetchDecisions, isReady]);

  const createDecision = useCallback(async (decisionData) => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/decisions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(decisionData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create decision');
      }
      
      const data = await response.json();
      // Add to beginning (newest first)
      const updater = prev => [data, ...prev];
      
      if (context && context.updateDecisions) {
        context.updateDecisions(updater);
      }
      // Always update local state too for immediate feedback
      setDecisions(updater);
      
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId, context]);

  // Get decisions from context if ready, otherwise from local state
  const getDecisions = () => {
    const source = isReady ? (context.decisions || []) : decisions;
    return tag ? source.filter(d => d.tag === tag) : source;
  };

  return {
    decisions: getDecisions(),
    loading: isReady ? false : loading,
    error: isReady ? null : error,
    refetch: isReady ? context.refetch : fetchDecisions,
    createDecision,
  };
};

export const useWorkspaceEquity = (workspaceId) => {
  const { user } = useUser();
  const { context, isReady } = useContextReady();
  const [equity, setEquity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEquity = useCallback(async () => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch equity scenarios');
      }
      
      const data = await response.json();
      setEquity(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, workspaceId]);

  useEffect(() => {
    if (!isReady) {
      fetchEquity();
    }
  }, [fetchEquity, isReady]);

  const createScenario = useCallback(async (scenarioData) => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity-scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(scenarioData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create equity scenario');
      }
      
      const data = await response.json();
      // Refetch to get updated list with all relationships
      if (context && context.refetch) {
        await context.refetch();
      }
      await fetchEquity();
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId, fetchEquity, context]);

  const setCurrentScenario = useCallback(async (scenarioId) => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity-scenarios/${scenarioId}/set-current`, {
        method: 'POST',
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to set current scenario');
      }
      
      const data = await response.json();
      // Refetch to get updated list
      if (context && context.refetch) {
        await context.refetch();
      }
      await fetchEquity();
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId, fetchEquity, context]);

  return {
    equity: isReady ? context.equity : equity,
    loading: isReady ? false : loading,
    error: isReady ? null : error,
    refetch: isReady ? context.refetch : fetchEquity,
    createScenario,
    setCurrentScenario,
  };
};

export const useWorkspaceRoles = (workspaceId) => {
  const { user } = useUser();
  const { context, isReady } = useContextReady();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoles = useCallback(async () => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/roles`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      
      const data = await response.json();
      setRoles(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, workspaceId]);

  useEffect(() => {
    if (!isReady) {
      fetchRoles();
    }
  }, [fetchRoles, isReady]);

  const upsertRole = useCallback(async (userId, roleData) => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/roles/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(roleData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update role');
      }
      
      const data = await response.json();
      // Update both context and local state
      const updater = prev => {
        const existing = prev.find(r => r.user_id === userId);
        if (existing) {
          return prev.map(r => r.user_id === userId ? { ...r, ...data } : r);
        }
        return [...prev, data];
      };
      
      if (context && context.updateRoles) {
        context.updateRoles(updater);
      }
      setRoles(updater);
      
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId, context]);

  return {
    roles: isReady ? context.roles : roles,
    loading: isReady ? false : loading,
    error: isReady ? null : error,
    refetch: isReady ? context.refetch : fetchRoles,
    upsertRole,
  };
};

export const useWorkspaceKPIs = (workspaceId) => {
  const { user } = useUser();
  const { context, isReady } = useContextReady();
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKPIs = useCallback(async () => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/kpis`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch KPIs');
      }
      
      const data = await response.json();
      setKpis(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, workspaceId]);

  useEffect(() => {
    if (!isReady) {
      fetchKPIs();
    }
  }, [fetchKPIs, isReady]);

  const createKPI = useCallback(async (kpiData) => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/kpis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(kpiData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create KPI');
      }
      
      const data = await response.json();
      // Add to beginning (newest first, since we order by created_at desc)
      const updater = prev => [data, ...prev];
      
      if (context && context.updateKpis) {
        context.updateKpis(updater);
      }
      // Always update local state too
      setKpis(updater);
      
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId, context]);

  const updateKPI = useCallback(async (kpiId, updates) => {
    if (!user || !user.id) return;
    
    try {
      const response = await fetch(`${API_BASE}/workspaces/kpis/${kpiId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update KPI');
      }
      
      const data = await response.json();
      const updater = prev => prev.map(k => k.id === kpiId ? { ...k, ...data } : k);
      
      if (context && context.updateKpis) {
        context.updateKpis(updater);
      }
      // Always update local state too
      setKpis(updater);
      
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, context]);

  return {
    kpis: isReady ? context.kpis : kpis,
    loading: isReady ? false : loading,
    error: isReady ? null : error,
    refetch: isReady ? context.refetch : fetchKPIs,
    createKPI,
    updateKPI,
  };
};

export const useWorkspaceCheckins = (workspaceId, limit = 3) => {
  const { user } = useUser();
  const { context, isReady } = useContextReady();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCheckins = useCallback(async () => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/checkins?limit=${limit}`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch checkins');
      }
      
      const data = await response.json();
      setCheckins(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, workspaceId, limit]);

  useEffect(() => {
    if (!isReady) {
      fetchCheckins();
    }
  }, [fetchCheckins, isReady]);

  const createCheckin = useCallback(async (checkinData) => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(checkinData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkin');
      }
      
      const data = await response.json();
      // Add to beginning (newest first) and respect limit
      const updater = prev => [data, ...prev].slice(0, limit);
      
      if (context && context.updateCheckins) {
        context.updateCheckins(updater);
      }
      // Always update local state too
      setCheckins(updater);
      
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId, limit, context]);

  // Apply limit to context data
  const getCheckins = () => {
    if (isReady) {
      return (context.checkins || []).slice(0, limit);
    }
    return checkins;
  };

  return {
    checkins: getCheckins(),
    loading: isReady ? false : loading,
    error: isReady ? null : error,
    refetch: isReady ? context.refetch : fetchCheckins,
    createCheckin,
  };
};

export const useWorkspaceParticipants = (workspaceId) => {
  const { user } = useUser();
  const { context, isReady } = useContextReady();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchParticipants = useCallback(async () => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/participants`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }
      
      const data = await response.json();
      setParticipants(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, workspaceId]);

  useEffect(() => {
    if (!isReady) {
      fetchParticipants();
    }
  }, [fetchParticipants, isReady]);

  const updateParticipant = useCallback(async (userId, updates) => {
    if (!user || !user.id || !workspaceId) return;
    
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/participants/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update participant');
      }
      
      const data = await response.json();
      const updater = prev => prev.map(p => 
        p.user_id === userId ? { ...p, ...data } : p
      );
      
      if (context && context.updateParticipants) {
        context.updateParticipants(updater);
      }
      // Always update local state too
      setParticipants(updater);
      
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId, context]);

  return {
    participants: isReady ? context.participants : participants,
    loading: isReady ? false : loading,
    error: isReady ? null : error,
    refetch: isReady ? context.refetch : fetchParticipants,
    updateParticipant,
  };
};
