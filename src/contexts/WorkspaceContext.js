import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { API_BASE } from '../config/api';

// Create the context
const WorkspaceContext = createContext(null);

/**
 * WorkspaceProvider - Provides consolidated workspace data to child components.
 * 
 * This context fetches all workspace data in a single API call and makes it available
 * to child components, reducing the number of API calls from ~10 to 1.
 * 
 * Usage:
 *   <WorkspaceProvider workspaceId={id}>
 *     <WorkspaceOverview />
 *   </WorkspaceProvider>
 * 
 * In child components:
 *   const { participants, kpis, decisions, ... } = useWorkspaceContext();
 */
export const WorkspaceProvider = ({ workspaceId, children }) => {
  const { user } = useUser();
  const [contextData, setContextData] = useState({
    workspace: null,
    participants: [],
    kpis: [],
    decisions: [],
    roles: [],
    checkins: [],
    equity: { scenarios: [], current: null },
    currentFounderId: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContext = useCallback(async () => {
    if (!user?.id || !workspaceId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/context`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch workspace context');
      }
      
      const data = await response.json();
      setContextData({
        workspace: data.workspace,
        participants: data.participants || [],
        kpis: data.kpis || [],
        decisions: data.decisions || [],
        roles: data.roles || [],
        checkins: data.checkins || [],
        equity: data.equity || { scenarios: [], current: null },
        currentFounderId: data.current_founder_id,
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching workspace context:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, workspaceId]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // Mutation helpers - these update local state and refetch if needed
  const updateParticipants = useCallback((updater) => {
    setContextData(prev => ({
      ...prev,
      participants: typeof updater === 'function' ? updater(prev.participants) : updater,
    }));
  }, []);

  const updateKpis = useCallback((updater) => {
    setContextData(prev => ({
      ...prev,
      kpis: typeof updater === 'function' ? updater(prev.kpis) : updater,
    }));
  }, []);

  const updateDecisions = useCallback((updater) => {
    setContextData(prev => ({
      ...prev,
      decisions: typeof updater === 'function' ? updater(prev.decisions) : updater,
    }));
  }, []);

  const updateRoles = useCallback((updater) => {
    setContextData(prev => ({
      ...prev,
      roles: typeof updater === 'function' ? updater(prev.roles) : updater,
    }));
  }, []);

  const updateCheckins = useCallback((updater) => {
    setContextData(prev => ({
      ...prev,
      checkins: typeof updater === 'function' ? updater(prev.checkins) : updater,
    }));
  }, []);

  const updateEquity = useCallback((updater) => {
    setContextData(prev => ({
      ...prev,
      equity: typeof updater === 'function' ? updater(prev.equity) : updater,
    }));
  }, []);

  const updateWorkspace = useCallback((updater) => {
    setContextData(prev => ({
      ...prev,
      workspace: typeof updater === 'function' ? updater(prev.workspace) : updater,
    }));
  }, []);

  const value = {
    // Data
    ...contextData,
    loading,
    error,
    
    // Refetch
    refetch: fetchContext,
    
    // Update helpers for optimistic updates
    updateParticipants,
    updateKpis,
    updateDecisions,
    updateRoles,
    updateCheckins,
    updateEquity,
    updateWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

/**
 * Hook to access workspace context data.
 * Must be used within a WorkspaceProvider.
 */
export const useWorkspaceContext = () => {
  const context = useContext(WorkspaceContext);
  if (context === null) {
    // Return null instead of throwing - allows graceful fallback to individual hooks
    return null;
  }
  return context;
};

/**
 * Check if we're inside a WorkspaceProvider
 */
export const useIsInWorkspaceProvider = () => {
  const context = useContext(WorkspaceContext);
  return context !== null;
};

export default WorkspaceContext;
