import React, { useState, useEffect, useRef } from 'react';
import { TextField, Box } from '@mui/material';
import { LocationOn } from '@mui/icons-material';

const LocationAutocomplete = ({ value, onChange, label, placeholder, helperText, sx, size }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const autocompleteRef = useRef(null);
  const containerRef = useRef(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setIsScriptLoaded(true);
      });
      return;
    }

    // Load Google Places API script
    const script = document.createElement('script');
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
    if (!apiKey) {
      console.warn('Google Maps API key not found. Location autocomplete will not work.');
      console.warn('Please set REACT_APP_GOOGLE_MAPS_API_KEY in your .env file');
      return;
    }
    // Load Google Maps Places API
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait a bit for the API to fully initialize
      setTimeout(() => {
        if (window.google?.maps?.places) {
      setIsScriptLoaded(true);
        } else {
          console.error('Google Maps API loaded but Places library not available');
        }
      }, 100);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API. Please check your API key and ensure Places API is enabled.');
    };
    document.head.appendChild(script);

    return () => {
      if (autocompleteRef.current) {
        // Cleanup if needed
      }
    };
  }, []);

  useEffect(() => {
    if (isScriptLoaded && containerRef.current && !autocompleteRef.current) {
      // Delay to ensure DOM is ready, especially for dialogs/modals
      const timer = setTimeout(() => {
      initializeAutocomplete();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isScriptLoaded]);

  const initializeAutocomplete = () => {
    if (!containerRef.current || !window.google?.maps?.places || autocompleteRef.current) {
      return;
    }

    try {
      // Get the actual input from Material-UI TextField
      // Try multiple times if in a dialog that might not be fully rendered
      let muiInput = containerRef.current.querySelector('input');
      if (!muiInput) {
        // Retry after a short delay for dialogs/modals
        setTimeout(() => {
          muiInput = containerRef.current?.querySelector('input');
          if (muiInput && !autocompleteRef.current) {
            setupAutocomplete(muiInput);
          }
        }, 200);
        return;
      }
      
      setupAutocomplete(muiInput);
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  };

  const setupAutocomplete = (muiInput) => {
    if (!muiInput || autocompleteRef.current) {
        return;
      }

      // Use AutocompleteService for predictions (this API still works)
      const autocompleteService = new window.google.maps.places.AutocompleteService();
      
      // Create a debounced function to fetch predictions
      let debounceTimer;
      const fetchPredictions = (query) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (query.length < 2) {
            hideCustomDropdown();
            return;
          }
          
          const request = {
            input: query,
            types: ['(regions)'],
          };

          autocompleteService.getPlacePredictions(request, (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              // Show custom dropdown with predictions
              showCustomDropdown(predictions, muiInput);
          } else if (status !== window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.warn('Google Places API error:', status);
            hideCustomDropdown();
            } else {
              hideCustomDropdown();
            }
          });
        }, 300);
      };

      // Listen to input changes
      const handleInput = (e) => {
        const query = e.target.value;
        if (query.length >= 2) {
          fetchPredictions(query);
        } else {
          hideCustomDropdown();
        }
      };

      muiInput.addEventListener('input', handleInput);

      // Store references for cleanup
      autocompleteRef.current = {
        service: autocompleteService,
        muiInput: muiInput,
        handleInput: handleInput,
        debounceTimer: debounceTimer,
      };
  };


  const showCustomDropdown = (predictions, inputElement) => {
    // Remove existing dropdown if any
    hideCustomDropdown();

    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.id = 'location-autocomplete-dropdown';
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      max-height: 300px;
      overflow-y: auto;
      z-index: 9999;
      margin-top: 4px;
    `;

    // Add click outside handler
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        hideCustomDropdown();
      }
    };
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      if (autocompleteRef.current) {
        autocompleteRef.current.clickOutsideHandler = handleClickOutside;
      }
    }, 0);

    predictions.forEach((prediction, index) => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
      `;
      item.textContent = prediction.description;
      item.onmouseover = () => {
        item.style.backgroundColor = '#f5f5f5';
      };
      item.onmouseout = () => {
        item.style.backgroundColor = 'white';
      };
      item.onclick = (e) => {
        e.stopPropagation();
        selectPlace(prediction.place_id);
        hideCustomDropdown();
      };
      dropdown.appendChild(item);
    });

    // Position dropdown relative to input
    const inputRect = inputElement.getBoundingClientRect();
    const container = containerRef.current;
    container.style.position = 'relative';
    container.appendChild(dropdown);
  };

  const hideCustomDropdown = () => {
    const dropdown = document.getElementById('location-autocomplete-dropdown');
    if (dropdown) {
      dropdown.remove();
    }
    // Remove any click outside handlers
    if (autocompleteRef.current?.clickOutsideHandler) {
      document.removeEventListener('click', autocompleteRef.current.clickOutsideHandler);
      autocompleteRef.current.clickOutsideHandler = null;
    }
  };

  const selectPlace = async (placeId) => {
    if (!window.google?.maps?.places) return;

    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails(
      {
        placeId: placeId,
        fields: ['formatted_address', 'address_components', 'geometry', 'name'],
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const locationString = formatLocation(place);
          setInputValue(locationString);
          onChange?.(locationString);
        }
      }
    );
  };

  const formatLocation = (place) => {
    if (!place.address_components || place.address_components.length === 0) {
      return place.formatted_address || place.name || '';
    }

    // Extract city, state, country
    let city = '';
    let state = '';
    let country = '';

    place.address_components.forEach(component => {
      const types = component.types;
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      } else if (types.includes('country')) {
        country = component.long_name;
      }
    });

    // Format: "City, State, Country" or "City, State" or "City, Country" or just "City"
    if (city && state && country) {
      return `${city}, ${state}, ${country}`;
    } else if (city && state) {
      return `${city}, ${state}`;
    } else if (city && country) {
      return `${city}, ${country}`;
    } else if (city) {
      return city;
    } else if (state && country) {
      return `${state}, ${country}`;
    } else if (country) {
      return country;
    }

    return place.formatted_address || place.name || '';
  };

  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    
    // If user types "Remote", allow it
    if (newValue.toLowerCase().trim() === 'remote') {
      onChange?.('Remote');
      hideCustomDropdown();
    } else if (newValue.trim() === '') {
      onChange?.('');
      hideCustomDropdown();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hideCustomDropdown();
      if (autocompleteRef.current) {
        const { muiInput, handleInput, debounceTimer } = autocompleteRef.current;
        if (muiInput && handleInput) {
          muiInput.removeEventListener('input', handleInput);
        }
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
      }
    };
  }, []);

  return (
    <Box ref={containerRef} sx={{ position: 'relative', ...sx }}>
      <TextField
        fullWidth
        size={size}
        label={label || 'Location'}
        placeholder={placeholder || 'Start typing a city, state, or country...'}
        helperText={helperText || 'Type to search for a location or enter "Remote"'}
        value={inputValue}
        onChange={handleInputChange}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          }
        }}
        InputProps={{
          startAdornment: (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
              <LocationOn sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
          ),
        }}
      />
    </Box>
  );
};

export default LocationAutocomplete;
