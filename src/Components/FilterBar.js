import React from 'react';
import { Box, Chip, IconButton } from '@mui/material';
import { Clear } from '@mui/icons-material';

const FilterBar = ({ onFilterChange, activeFilters, onPreferencesChange, preferences }) => {
  const hasActiveFilters = activeFilters && (
    activeFilters.search ||
    (activeFilters.skills && activeFilters.skills.length > 0) ||
    activeFilters.location ||
    activeFilters.project_stage ||
    activeFilters.looking_for
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
        looking_for: ''
      });
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
