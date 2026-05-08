import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, alpha } from '@mui/material';
import { Psychology } from '@mui/icons-material';
import { PROJECT_COMPATIBILITY_QUESTIONS } from './ProjectCompatibilityQuiz';

const TEAL = '#0d9488';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

/** Category order must match project creation steps (NewProjectDialog / MyProjects). */
export const COMPATIBILITY_CATEGORY_ORDER = [
  'Work style',
  'Vision & funding',
  'Roles & equity',
  'Culture & team setup',
  'Conflict & communication under stress',
];

function getQuestionsByCategory(category) {
  return PROJECT_COMPATIBILITY_QUESTIONS.filter((q) => q.category === category);
}

function CategoryQaBlock({ category, compatibilityAnswers }) {
  const questionsInCategory = getQuestionsByCategory(category);
  const answered = questionsInCategory.filter((q) => compatibilityAnswers[q.id]).length;

  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_500, display: 'block', mb: 1.5 }}>
        {category} ({answered} answers)
      </Typography>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
        <Box component="tbody">
          {questionsInCategory.map((question) => {
            const answerValue = compatibilityAnswers[question.id];
            if (!answerValue) return null;
            const selectedOption = question.options.find((opt) => opt.value === answerValue);
            if (!selectedOption) return null;
            const shortAnswer = selectedOption.label.replace(/^[A-D]\.\s*/, '').split('–')[0].trim();
            return (
              <Box
                component="tr"
                key={question.id}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: SLATE_200,
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Box component="td" sx={{ py: 1.5, pr: 2, width: '45%', verticalAlign: 'top' }}>
                  <Typography variant="caption" sx={{ fontWeight: 500, color: SLATE_500 }}>
                    {question.question.replace(/\?$/, '')}
                  </Typography>
                </Box>
                <Box component="td" sx={{ py: 1.5, verticalAlign: 'top' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: SLATE_900 }}>
                    {shortAnswer}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          {answered === 0 && (
            <Box component="tr">
              <Box component="td" colSpan={2} sx={{ py: 2 }}>
                <Typography variant="body2" sx={{ color: SLATE_500 }}>
                  Nothing answered in this section.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Read-only tabbed view of a project's compatibility quiz answers (stored in compatibility_answers).
 * @param {string|null} focusCategory - If set, only that category is shown (no inner tabs). For nested parent tabs.
 */
export default function ProjectCompatibilityAnswersTabs({ compatibilityAnswers = {}, focusCategory = null }) {
  const [tab, setTab] = useState(0);
  const answeredCount = (cat) =>
    getQuestionsByCategory(cat).filter((q) => compatibilityAnswers[q.id]).length;

  if (focusCategory) {
    return <CategoryQaBlock category={focusCategory} compatibilityAnswers={compatibilityAnswers} />;
  }

  if (!compatibilityAnswers || Object.keys(compatibilityAnswers).length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: SLATE_500 }}>
          No founder questionnaire answers were saved for this project.
        </Typography>
      </Box>
    );
  }

  const activeCategory = COMPATIBILITY_CATEGORY_ORDER[tab];
  const questionsInCategory = getQuestionsByCategory(activeCategory);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Psychology sx={{ color: TEAL, fontSize: 20 }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_500 }}>
          Founder questionnaire (from project setup)
        </Typography>
      </Box>
      <Box
        sx={{
          bgcolor: BG,
          borderRadius: 2,
          border: '1px solid',
          borderColor: SLATE_200,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 240,
          maxHeight: { xs: 360, sm: 420 },
        }}
      >
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid',
            borderColor: SLATE_200,
            bgcolor: '#fff',
            flexShrink: 0,
            '& .MuiTab-root': {
              textTransform: 'none',
              minHeight: 48,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: SLATE_500,
              '&.Mui-selected': { color: TEAL },
            },
            '& .MuiTabs-indicator': { bgcolor: TEAL },
          }}
        >
          {COMPATIBILITY_CATEGORY_ORDER.map((category, index) => (
            <Tab key={category} label={`${category} (${answeredCount(category)})`} value={index} />
          ))}
        </Tabs>

        <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="tbody">
              {questionsInCategory.map((question) => {
                const answerValue = compatibilityAnswers[question.id];
                if (!answerValue) return null;
                const selectedOption = question.options.find((opt) => opt.value === answerValue);
                if (!selectedOption) return null;
                const shortAnswer = selectedOption.label.replace(/^[A-D]\.\s*/, '').split('–')[0].trim();

                return (
                  <Box
                    component="tr"
                    key={question.id}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: SLATE_200,
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box
                      component="td"
                      sx={{ py: 1.5, pr: 2, width: '45%', verticalAlign: 'top' }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 500, color: SLATE_500 }}>
                        {question.question.replace(/\?$/, '')}
                      </Typography>
                    </Box>
                    <Box component="td" sx={{ py: 1.5, verticalAlign: 'top' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: SLATE_900 }}>
                        {shortAnswer}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              {answeredCount(activeCategory) === 0 && (
                <Box component="tr">
                  <Box component="td" colSpan={2} sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ color: SLATE_500 }}>
                      Nothing answered in this section.
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
