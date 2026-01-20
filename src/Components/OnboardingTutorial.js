import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton,
  Avatar,
  Fade,
  Backdrop
} from '@mui/material';
import { 
  Close, 
  ArrowForward, 
  ArrowBack,
  Rocket,
  Lightbulb,
  CheckCircle
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const TUTORIAL_STEPS = [
  {
    id: 'filters',
    title: 'Discover Your Perfect Match',
    content: 'Use filters to narrow down projects that match your skills, location, and interests. The more specific you are, the better matches you\'ll find!',
    position: 'bottom',
    highlight: 'filter-bar',
  },
  {
    id: 'advanced-search',
    title: 'Advanced Search',
    content: 'Click here to access advanced search options and find projects with specific criteria. Available for Pro+ members.',
    position: 'bottom',
    highlight: 'advanced-search-btn',
  },
  {
    id: 'project-cards',
    title: 'Browse Projects',
    content: 'Swipe through project cards or use arrow keys to navigate. Each card shows key information about the project and founder.',
    position: 'center',
    highlight: 'project-cards',
  },
  {
    id: 'connect',
    title: 'Make Connections',
    content: 'When you find a project you\'re interested in, click "Connect" to start a conversation. You can also click the card to see more details.',
    position: 'top',
    highlight: 'connect-btn',
  },
  {
    id: 'navigation',
    title: 'Navigate Easily',
    content: 'Use the arrow buttons or keyboard arrows to move between projects. The progress dots show your position in the discovery feed.',
    position: 'top',
    highlight: 'navigation-controls',
  },
];

const OnboardingTutorial = ({ onComplete, isFirstTime }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState(null);

  useEffect(() => {
    if (isFirstTime) {
      // Small delay to ensure page is loaded and elements are rendered
      const timer = setTimeout(() => {
        setIsVisible(true);
        // Try to highlight element with retry logic
        const tryHighlight = (attempts = 0) => {
          const element = document.querySelector(`[data-tutorial-id="${TUTORIAL_STEPS[0].highlight}"]`);
          if (element) {
            setHighlightedElement(element);
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (attempts < 5) {
            setTimeout(() => tryHighlight(attempts + 1), 200);
          }
        };
        tryHighlight();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isFirstTime]);

  const highlightElement = (elementId, attempts = 0) => {
    const element = document.querySelector(`[data-tutorial-id="${elementId}"]`);
    if (element) {
      setHighlightedElement(element);
      // Scroll element into view if needed
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else if (attempts < 3) {
      // Retry finding element after a short delay
      setTimeout(() => highlightElement(elementId, attempts + 1), 200);
    } else {
      setHighlightedElement(null);
    }
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      highlightElement(TUTORIAL_STEPS[nextStep].highlight);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      highlightElement(TUTORIAL_STEPS[prevStep].highlight);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setHighlightedElement(null);
    // Tutorial completion is now tracked in backend via onComplete callback
    if (onComplete) {
      onComplete();
    }
  };

  if (!isVisible || !isFirstTime) return null;

  const currentStepData = TUTORIAL_STEPS[currentStep];
  const stepPosition = currentStepData?.position || 'bottom';
  const elementRect = highlightedElement?.getBoundingClientRect();

  // Calculate tooltip position based on highlighted element
  const getTooltipPosition = () => {
    if (!elementRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const spacing = 20;
    const tooltipWidth = window.innerWidth < 600 ? window.innerWidth - 40 : 360;
    const tooltipHeight = 200;

    let top, left, transform;

    switch (stepPosition) {
      case 'top':
        top = elementRect.top - tooltipHeight - spacing;
        left = elementRect.left + (elementRect.width / 2);
        transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        top = elementRect.bottom + spacing;
        left = elementRect.left + (elementRect.width / 2);
        transform = 'translate(-50%, 0)';
        break;
      case 'left':
        top = elementRect.top + (elementRect.height / 2);
        left = elementRect.left - tooltipWidth - spacing;
        transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        top = elementRect.top + (elementRect.height / 2);
        left = elementRect.right + spacing;
        transform = 'translate(0, -50%)';
        break;
      default: // center
        top = elementRect.top + (elementRect.height / 2);
        left = elementRect.left + (elementRect.width / 2);
        transform = 'translate(-50%, -50%)';
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 20) left = 20;
    if (left + tooltipWidth > viewportWidth - 20) {
      left = viewportWidth - tooltipWidth - 20;
    }
    if (top < 20) top = 20;
    if (top + tooltipHeight > viewportHeight - 20) {
      top = viewportHeight - tooltipHeight - 20;
    }

    return { top: `${top}px`, left: `${left}px`, transform };
  };

  return (
    <>
      {/* Backdrop overlay */}
      <Backdrop
        open={isVisible}
        sx={{
          zIndex: 1300,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
        }}
      >
        {/* Highlight overlay for element */}
        {highlightedElement && elementRect && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            sx={{
              position: 'absolute',
              top: `${elementRect.top - 8}px`,
              left: `${elementRect.left - 8}px`,
              width: `${elementRect.width + 16}px`,
              height: `${elementRect.height + 16}px`,
              border: '3px solid #1e3a8a',
              borderRadius: 2,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(30, 58, 138, 0.5)',
              pointerEvents: 'none',
              zIndex: 1301,
            }}
          />
        )}
      </Backdrop>

      {/* Tooltip */}
      {currentStepData && (
        <Paper
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          elevation={8}
          sx={{
            position: 'fixed',
            ...getTooltipPosition(),
            width: { xs: 'calc(100vw - 40px)', sm: 360 },
            maxWidth: { xs: 'calc(100vw - 40px)', sm: 360 },
            zIndex: 1302,
            bgcolor: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(30, 58, 138, 0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with mascot */}
          <Box
            sx={{
              bgcolor: '#1e3a8a',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
            }}
          >
            <Avatar
              sx={{
                bgcolor: '#3b82f6',
                width: 48,
                height: 48,
                flexShrink: 0,
              }}
            >
              <Rocket sx={{ fontSize: 28 }} />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'white' }}>
                  {currentStepData.title}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleSkip}
                  sx={{
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {currentStepData.content}
              </Typography>
            </Box>
          </Box>

          {/* Footer with navigation */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Step indicator */}
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                {currentStep + 1} of {TUTORIAL_STEPS.length}
              </Typography>
              {/* Progress dots */}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {TUTORIAL_STEPS.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: index === currentStep ? '#1e3a8a' : index < currentStep ? '#3b82f6' : '#cbd5e1',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {currentStep > 0 && (
                <Button
                  size="small"
                  onClick={handlePrevious}
                  startIcon={<ArrowBack />}
                  sx={{
                    color: '#64748b',
                    '&:hover': { bgcolor: 'rgba(100, 116, 139, 0.1)' },
                  }}
                >
                  Back
                </Button>
              )}
              <Button
                variant="contained"
                size="small"
                onClick={handleNext}
                endIcon={currentStep === TUTORIAL_STEPS.length - 1 ? <CheckCircle /> : <ArrowForward />}
                sx={{
                  bgcolor: '#1e3a8a',
                  color: 'white',
                  '&:hover': { bgcolor: '#3b82f6' },
                  fontWeight: 500,
                }}
              >
                {currentStep === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default OnboardingTutorial;
