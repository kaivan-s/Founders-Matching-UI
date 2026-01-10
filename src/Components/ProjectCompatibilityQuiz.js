import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Divider,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { Psychology, TrendingUp, BusinessCenter, Groups, AttachMoney, Schedule, InfoOutlined } from '@mui/icons-material';

// Tooltip explanations for each option (in simple, layman terms)
const OPTION_TOOLTIPS = {
  // Decision making
  consensus: 'Everyone talks it out first, then you decide together. Like choosing a restaurant with friends - everyone gives input first.',
  move_fast: 'Make quick decisions and fix things as you go. Like trying a new restaurant quickly - if it\'s bad, you can always change plans.',
  data_driven: 'Look at numbers and facts to decide. Like checking restaurant ratings before choosing where to eat.',
  
  // Work hours
  regular: 'Standard work hours, like a regular job. Mostly Monday-Friday, 9am-5pm type schedule.',
  flexible: 'Work whenever works for you, as long as you get the job done. No strict schedule, just meet your deadlines.',
  intense: 'Work hard, including evenings and weekends when needed. Perfect for early stages when you\'re building fast.',
  
  // Communication
  async: 'Send messages and emails, reply when you can (within a few hours). No need for immediate responses.',
  realtime: 'Quick back-and-forth, like texting or instant messaging. Fast replies and lots of quick chats.',
  meetings: 'Scheduled calls and regular check-ins. Set times to talk, like weekly team meetings.',
  
  // Ideal outcome
  acquisition: 'Sell the company to a bigger company in 3-5 years. Like building a house and selling it for profit.',
  ipo: 'Build a huge company over many years that eventually goes public. Like building a company that becomes the next Google.',
  lifestyle: 'Build a profitable business that lets you live comfortably. Like having a successful local business that pays well.',
  
  // Funding
  bootstrap: 'Use your own money and keep full control. No investors, you own everything.',
  vc_backed: 'Get money from investors to grow really fast. You give up some ownership but get money to scale quickly.',
  hybrid: 'Start with your own money, maybe get investors later if needed. Keep options open.',
  
  // Timeline
  quick: 'Ready for things to happen fast, in 2-3 years. Fast-paced journey.',
  long_term: 'Committed for the long haul, 5-10 years. Building something that takes time.',
  flexible: 'Open to whatever timeline works. See how things go and adjust.',
  
  // Financial risk
  high: 'Ready to take a big pay cut or quit your job soon. High risk, high reward.',
  medium: 'Can work part-time or reduce income for a while. Moderate risk level.',
  low: 'Need steady income while building. Prefer financial stability and lower risk.',
  
  // Primary role
  technical: 'Build the actual product - coding, software, technology. The person who makes things work.',
  business: 'Handle sales, marketing, hiring, operations. The person who runs the business side.',
  product: 'Design the experience, plan features, talk to users. The person who decides what to build and how it should feel.',
  
  // Equity split
  equal: 'Split ownership 50/50 or equally among all founders. Everyone owns the same amount.',
  merit: 'Split based on who contributes more, takes more risk, or works harder. Not necessarily equal.',
  negotiable: 'Willing to discuss and figure it out. Open to different arrangements.',
  
  // Final say
  one_ceo: 'One person makes the final call on big decisions. Clear leader who breaks ties.',
  shared: 'Discuss together, but the CEO can make the call if you can\'t agree. Mostly shared decisions.',
  always_joint: 'Everyone must agree before moving forward. No decision without full team agreement.',
  
  // Team size
  lean: 'Keep it small - just the co-founders (2-3 people total). Minimal team, maximum control.',
  small: 'Hire a few people (5-10 total) carefully. Small team, selective hiring.',
  grow_fast: 'Hire quickly if things work (20+ people). Scale fast when you see success.',
  
  // Work model
  remote_first: 'Everyone works from wherever they want. Fully remote, no office needed.',
  hybrid: 'Mix of working from home and meeting in person sometimes. Flexible location.',
  in_person: 'Mostly work together in the same office or location. Physical presence preferred.',
  
  // Formal process
  very_important: 'Want clear rules, written goals, and regular check-ins from the start. Structured approach.',
  somewhat_important: 'Some structure is good, but keep it light. Basic processes, not too formal.',
  not_important: 'Keep it casual and flexible. No strict rules or formal processes needed.',
  
  // Disagreement
  direct: 'Say what you think strongly and push for your way. Very straightforward and assertive.',
  middle_ground: 'Share your opinion clearly, then try to find a compromise. Balanced approach.',
  gentle: 'Bring it up softly and avoid big arguments. Careful, diplomatic style.',
  let_go: 'Often just drop it to avoid conflict. Prefer keeping peace over pushing your view.',
  
  // Things go wrong
  problem_solving: 'Jump right into fixing the problem immediately. Action-oriented, move fast.',
  discuss_openly: 'Take a moment to think, then talk about it with your partner. Thoughtful, then collaborative.',
  time_alone: 'Need to process alone first before discussing. Need space to think.',
  withdraw: 'Pull back and don\'t really want to talk about it much. Prefer to deal with it quietly.',
};

export const PROJECT_COMPATIBILITY_QUESTIONS = [
  // Work style (3)
  {
    id: 'decision_making',
    category: 'Work style',
    question: 'How do you prefer to make important decisions?',
    icon: <Psychology />,
    options: [
      { value: 'consensus', label: 'A. Consensus – Discuss with the team before deciding' },
      { value: 'move_fast', label: 'B. Move fast – Decide quickly and iterate' },
      { value: 'data_driven', label: 'C. Data‑driven – Let metrics guide decisions' },
    ]
  },
  {
    id: 'work_hours',
    category: 'Work style',
    question: 'What are your preferred working hours / intensity?',
    icon: <Schedule />,
    options: [
      { value: 'regular', label: 'A. Regular schedule – Mostly 9–5, predictable' },
      { value: 'flexible', label: 'B. Flexible – Work when it fits, as long as outcomes are met' },
      { value: 'intense', label: 'C. Intense – Nights and weekends are fine while we\'re early' },
    ]
  },
  {
    id: 'communication',
    category: 'Work style',
    question: 'How do you prefer to communicate day‑to‑day?',
    icon: <Groups />,
    options: [
      { value: 'async', label: 'A. Async – Slack/email, replies within a few hours is fine' },
      { value: 'realtime', label: 'B. Real‑time – Calls/DMs, fast back‑and‑forth' },
      { value: 'meetings', label: 'C. Regular meetings – Scheduled check‑ins and weekly syncs' },
    ]
  },
  // Vision & funding (4)
  {
    id: 'ideal_outcome',
    category: 'Vision & funding',
    question: 'What\'s your ideal outcome for this startup?',
    icon: <TrendingUp />,
    options: [
      { value: 'acquisition', label: 'A. Acquisition in 3–5 years' },
      { value: 'ipo', label: 'B. IPO / very large company over 7–10+ years' },
      { value: 'lifestyle', label: 'C. Profitable lifestyle business that supports a good living' },
    ]
  },
  {
    id: 'funding',
    category: 'Vision & funding',
    question: 'How do you want to fund the company?',
    icon: <AttachMoney />,
    options: [
      { value: 'bootstrap', label: 'A. Bootstrap – Self‑funded, retain control' },
      { value: 'vc_backed', label: 'B. VC‑backed – Raise capital and grow fast' },
      { value: 'hybrid', label: 'C. Hybrid – Start lean, raise only if it makes sense later' },
    ]
  },
  {
    id: 'timeline',
    category: 'Vision & funding',
    question: 'What timeline are you mentally prepared for?',
    icon: <Schedule />,
    options: [
      { value: 'quick', label: 'A. Quick outcome (2–3 years)' },
      { value: 'long_term', label: 'B. Long‑term build (5–10 years)' },
      { value: 'flexible', label: 'C. Flexible – Open to both, depending on traction' },
    ]
  },
  {
    id: 'financial_risk',
    category: 'Vision & funding',
    question: 'How much personal financial risk are you willing to take?',
    icon: <AttachMoney />,
    options: [
      { value: 'high', label: 'A. High – Ready to cut income significantly or quit job soon' },
      { value: 'medium', label: 'B. Medium – Can reduce income/commit part‑time for a while' },
      { value: 'low', label: 'C. Low – Need strong financial stability while building' },
    ]
  },
  // Roles & equity (3)
  {
    id: 'primary_role',
    category: 'Roles & equity',
    question: 'What role do you primarily see yourself in?',
    icon: <BusinessCenter />,
    options: [
      { value: 'technical', label: 'A. Technical – Building and scaling the product' },
      { value: 'business', label: 'B. Business – Sales, growth, operations, hiring' },
      { value: 'product', label: 'C. Product – Vision, UX, roadmap, user research' },
    ]
  },
  {
    id: 'equity_split',
    category: 'Roles & equity',
    question: 'How do you think equity should be split between co‑founders?',
    icon: <AttachMoney />,
    options: [
      { value: 'equal', label: 'A. Equal split – 50/50 (or equal among all)' },
      { value: 'merit', label: 'B. Merit‑based – Depends on contribution, risk, and time' },
      { value: 'negotiable', label: 'C. Negotiable – Open, prefer to discuss case‑by‑case' },
    ]
  },
  {
    id: 'final_say',
    category: 'Roles & equity',
    question: 'Who should have final say on major decisions (fundraising, pivots, key hires)?',
    icon: <BusinessCenter />,
    options: [
      { value: 'one_ceo', label: 'A. One clear CEO / final decision‑maker' },
      { value: 'shared', label: 'B. Shared – Debate together, CEO breaks ties if needed' },
      { value: 'always_joint', label: 'C. Always joint – Move only when everyone agrees' },
    ]
  },
  // Culture & team setup (3)
  {
    id: 'team_size',
    category: 'Culture & team setup',
    question: 'Ideal team size for year 1?',
    icon: <Groups />,
    options: [
      { value: 'lean', label: 'A. Lean – Just co-founders (2–3 people)' },
      { value: 'small', label: 'B. Small – Hire 5–10 people carefully' },
      { value: 'grow_fast', label: 'C. Grow fast – Aim for 20+ quickly if things work' },
    ]
  },
  {
    id: 'work_model',
    category: 'Culture & team setup',
    question: 'What\'s your preferred work model?',
    icon: <BusinessCenter />,
    options: [
      { value: 'remote_first', label: 'A. Remote‑first – Work from anywhere' },
      { value: 'hybrid', label: 'B. Hybrid – Mix of remote and in‑person' },
      { value: 'in_person', label: 'C. In‑person – Mostly office/co‑located' },
    ]
  },
  {
    id: 'formal_process',
    category: 'Culture & team setup',
    question: 'How important is formal process (OKRs, written docs, rituals) in year 1?',
    icon: <BusinessCenter />,
    options: [
      { value: 'very_important', label: 'A. Very important – Want clear processes early' },
      { value: 'somewhat_important', label: 'B. Somewhat important – Light structure is enough' },
      { value: 'not_important', label: 'C. Not important – Prefer to keep it loose and informal' },
    ]
  },
  // Conflict & communication under stress (2)
  {
    id: 'disagreement',
    category: 'Conflict & communication under stress',
    question: 'When you strongly disagree with your co‑founder, you usually…',
    icon: <Psychology />,
    options: [
      { value: 'direct', label: 'A. Say it directly and push hard for your view' },
      { value: 'middle_ground', label: 'B. Share your view clearly, then look for middle ground' },
      { value: 'gentle', label: 'C. Raise it gently and try to avoid heated conflict' },
      { value: 'let_go', label: 'D. Often let it go to keep the peace' },
    ]
  },
  {
    id: 'things_go_wrong',
    category: 'Conflict & communication under stress',
    question: 'When things go wrong (missed targets, failed launch), you tend to…',
    icon: <Psychology />,
    options: [
      { value: 'problem_solving', label: 'A. Go into problem‑solving mode immediately and move fast' },
      { value: 'discuss_openly', label: 'B. Take a moment, then discuss openly with your co‑founder' },
      { value: 'time_alone', label: 'C. Need time alone before talking about it' },
      { value: 'withdraw', label: 'D. Withdraw and prefer not to talk much about it' },
    ]
  },
];

const ProjectCompatibilityQuiz = ({ answers, onChange, category, progress = 0 }) => {
  const handleAnswerChange = (questionId, value) => {
    onChange(questionId, value);
  };

  // Filter questions by category if provided
  const questionsToShow = category
    ? PROJECT_COMPATIBILITY_QUESTIONS.filter(q => q.category === category)
    : PROJECT_COMPATIBILITY_QUESTIONS;

  // Get category icon based on category name
  const getCategoryIcon = (cat) => {
    if (cat === 'Work style') return <Schedule />;
    if (cat === 'Vision & funding') return <TrendingUp />;
    if (cat === 'Roles & equity') return <AttachMoney />;
    if (cat === 'Culture & team setup') return <Groups />;
    if (cat === 'Conflict & communication under stress') return <Psychology />;
    return <Psychology />;
  };

  return (
    <Box>
      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{ 
            p: 0.75,
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Box sx={{ color: 'primary.main', fontSize: 20, display: 'flex', alignItems: 'center' }}>
              {category ? getCategoryIcon(category) : <Psychology />}
            </Box>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
            {category || 'Project Compatibility Assessment'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {category 
            ? `Answer these questions about ${category.toLowerCase()} to help us match you with compatible co-founders.`
            : 'Answer these questions to help us match you with co-founders who align with your vision and work style for this project.'}
        </Typography>
        {category && progress > 0 && (
          <Box sx={{ px: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
                }
              }} 
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {Math.round(progress)}% complete
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {questionsToShow.map((q, index) => (
          <Paper
            key={q.id}
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: answers[q.id] ? 'primary.main' : 'divider',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              background: answers[q.id] 
                ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.03) 0%, rgba(20, 184, 166, 0.03) 100%)'
                : 'white',
            }}
          >
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ color: 'primary.main' }}>{q.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {index + 1}. {q.question}
                  </Typography>
                </Box>
              </FormLabel>
              <RadioGroup
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              >
                {q.options.map((option) => (
                  <Tooltip
                    key={option.value}
                    title={OPTION_TOOLTIPS[option.value] || ''}
                    arrow
                    placement="right"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: 'rgba(15, 23, 42, 0.95)',
                          maxWidth: 350,
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          p: 1.5,
                        },
                      },
                      arrow: {
                        sx: {
                          color: 'rgba(15, 23, 42, 0.95)',
                        },
                      },
                    }}
                  >
                    <FormControlLabel
                      value={option.value}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {option.label}
                          </Typography>
                          <InfoOutlined 
                            sx={{ 
                              fontSize: 16, 
                              color: 'text.secondary',
                              opacity: 0.6,
                              '&:hover': {
                                opacity: 1,
                              },
                            }} 
                          />
                        </Box>
                      }
                      sx={{
                        ml: 0,
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: answers[q.id] === option.value ? 'primary.main' : 'transparent',
                        bgcolor: answers[q.id] === option.value ? 'rgba(14, 165, 233, 0.05)' : 'transparent',
                        mb: 1,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.light',
                          bgcolor: 'rgba(14, 165, 233, 0.03)',
                        },
                      }}
                    />
                  </Tooltip>
                ))}
              </RadioGroup>
            </FormControl>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default ProjectCompatibilityQuiz;

