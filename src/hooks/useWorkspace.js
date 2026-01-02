import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { API_BASE } from '../config/api';

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
      console.log('Workspace update response:', data);
      // Update the workspace state with the full response data
      setWorkspace(data);
      return data;
    } catch (err) {
      console.error('Update workspace error:', err);
      throw err;
    }
  }, [user, workspaceId]);

  return { workspace, loading, error, refetch: fetchWorkspace, updateWorkspace };
};

export const useWorkspaceDecisions = (workspaceId, tag = null) => {
  const { user } = useUser();
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
    fetchDecisions();
  }, [fetchDecisions]);

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
      setDecisions(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId]);

  return { decisions, loading, error, refetch: fetchDecisions, createDecision };
};

export const useWorkspaceEquity = (workspaceId) => {
  const { user } = useUser();
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
    fetchEquity();
  }, [fetchEquity]);

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
      await fetchEquity(); // Refetch to get updated list
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId, fetchEquity]);

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
      await fetchEquity(); // Refetch to get updated list
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId, fetchEquity]);

  return { equity, loading, error, refetch: fetchEquity, createScenario, setCurrentScenario };
};

export const useWorkspaceRoles = (workspaceId) => {
  const { user } = useUser();
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
    fetchRoles();
  }, [fetchRoles]);

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
      await fetchRoles(); // Refetch
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId, fetchRoles]);

  return { roles, loading, error, refetch: fetchRoles, upsertRole };
};

export const useWorkspaceKPIs = (workspaceId) => {
  const { user } = useUser();
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
    fetchKPIs();
  }, [fetchKPIs]);

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
      setKpis(prev => [...prev, data]);
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId]);

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
      setKpis(prev => prev.map(k => k.id === kpiId ? data : k));
      return data;
    } catch (err) {
      throw err;
    }
  }, [user]);

  return { kpis, loading, error, refetch: fetchKPIs, createKPI, updateKPI };
};

export const useWorkspaceCheckins = (workspaceId, limit = 3) => {
  const { user } = useUser();
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
    fetchCheckins();
  }, [fetchCheckins]);

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
      setCheckins(prev => [data, ...prev].slice(0, limit));
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId, limit]);

  return { checkins, loading, error, refetch: fetchCheckins, createCheckin };
};

export const useWorkspaceParticipants = (workspaceId) => {
  const { user } = useUser();
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
    fetchParticipants();
  }, [fetchParticipants]);

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
      // Merge the updated data with existing participant data to preserve user info
      setParticipants(prev => prev.map(p => 
        p.user_id === userId ? { ...p, ...data } : p
      ));
      return data;
    } catch (err) {
      throw err;
    }
  }, [user, workspaceId]);

  return { participants, loading, error, refetch: fetchParticipants, updateParticipant };
};

