import React from 'react';
import { Box, Chip, IconButton } from '@mui/material';
import { Clear, Verified } from '@mui/icons-material';

const FilterBar = ({ onFilterChange, activeFilters, onPreferencesChange, preferences }) => {
  const hasActiveFilters = activeFilters && (
    activeFilters.search ||
    (activeFilters.skills && activeFilters.skills.length > 0) ||
    activeFilters.location ||
    activeFilters.project_stage ||
    activeFilters.looking_for ||
    activeFilters.verification_tier ||
    activeFilters.time_commitment
  );
  
  const hasActivePreferences = preferences && Object.keys(preferences).filter(k => preferences[k]).length > 0;

  const handleClearFilter = (filterKey) => {
    if (onFilterChange) {
      const newFilters = { ...activeFilters };
      if (filterKey === 'skills') {
        newFilters[filterKey] = [];
      } else {
        newFilters[filterKey] = '';
      }
      onFilterChange(newFilters);
    }
  };

  const handleClearAll = () => {
    if (onFilterChange) {
      onFilterChange({
        search: '',
        skills: [],
        location: '',
        project_stage: '',
        looking_for: '',
        verification_tier: '',
        time_commitment: ''
      });
    }
  };

  const getVerificationLabel = (tier) => {
    switch (tier) {
      case 'HIGHLY_VERIFIED': return 'Highly Verified';
      case 'PRO_VERIFIED': return 'Pro Verified';
      case 'VERIFIED': return 'Verified';
      default: return tier;
    }
  };

  const getCommitmentLabel = (commitment) => {
    switch (commitment) {
      case 'full_time': return 'Full-time';
      case 'part_time': return 'Part-time';
      case 'flexible': return 'Flexible';
      case 'advisory': return 'Advisory';
      default: return commitment;
    }
  };

  if (!hasActiveFilters && !hasActivePreferences) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      {hasActivePreferences && (
        <Chip
          label="Compatibility Matching Active"
          size="small"
          sx={{ 
            bgcolor: '#1e3a8a', 
            color: 'white',
            fontWeight: 600,
            fontSize: '0.7rem'
          }}
        />
      )}
      {activeFilters.search && (
        <Chip
          label={`Search: ${activeFilters.search}`}
          onDelete={() => handleClearFilter('search')}
          size="small"
          sx={{ bgcolor: '#e0f2fe', color: '#0369a1' }}
        />
      )}
      {activeFilters.location && (
        <Chip
          label={`Location: ${activeFilters.location}`}
          onDelete={() => handleClearFilter('location')}
          size="small"
          sx={{ bgcolor: '#e0f2fe', color: '#0369a1' }}
        />
      )}
      {activeFilters.project_stage && (
        <Chip
          label={`Stage: ${activeFilters.project_stage}`}
          onDelete={() => handleClearFilter('project_stage')}
          size="small"
          sx={{ bgcolor: '#e0f2fe', color: '#0369a1' }}
        />
      )}
      {activeFilters.looking_for && (
        <Chip
          label={`Looking for: ${activeFilters.looking_for}`}
          onDelete={() => handleClearFilter('looking_for')}
          size="small"
          sx={{ bgcolor: '#e0f2fe', color: '#0369a1' }}
        />
      )}
      {activeFilters.skills && activeFilters.skills.length > 0 && (
        <>
          {activeFilters.skills.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              onDelete={() => {
                const newSkills = activeFilters.skills.filter((_, i) => i !== index);
                if (onFilterChange) {
                  onFilterChange({ ...activeFilters, skills: newSkills });
                }
              }}
              size="small"
              sx={{ bgcolor: '#e0f2fe', color: '#0369a1' }}
            />
          ))}
        </>
      )}
      {activeFilters.verification_tier && (
        <Chip
          icon={<Verified sx={{ fontSize: 14 }} />}
          label={getVerificationLabel(activeFilters.verification_tier)}
          onDelete={() => handleClearFilter('verification_tier')}
          size="small"
          sx={{ 
            bgcolor: activeFilters.verification_tier === 'HIGHLY_VERIFIED' ? '#dcfce7' :
                     activeFilters.verification_tier === 'PRO_VERIFIED' ? '#dbeafe' : '#ccfbf1',
            color: activeFilters.verification_tier === 'HIGHLY_VERIFIED' ? '#16a34a' :
                   activeFilters.verification_tier === 'PRO_VERIFIED' ? '#2563eb' : '#0d9488',
            '& .MuiChip-icon': { color: 'inherit' }
          }}
        />
      )}
      {activeFilters.time_commitment && (
        <Chip
          label={`Commitment: ${getCommitmentLabel(activeFilters.time_commitment)}`}
          onDelete={() => handleClearFilter('time_commitment')}
          size="small"
          sx={{ bgcolor: '#fef3c7', color: '#d97706' }}
        />
      )}
      <IconButton
        size="small"
        onClick={handleClearAll}
        sx={{ 
          color: '#64748b',
          '&:hover': { color: '#0f172a' }
        }}
      >
        <Clear fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default FilterBar;
