import React from 'react';
import { Box, Container, Typography, Divider, alpha } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Information We Collect',
      content: [
        'We collect information that you provide directly to us, including:',
        '• Account information (name, email address, profile details)',
        '• Project and workspace information',
        '• Communication data (messages, check-ins, decisions)',
        '• Payment and billing information (processed securely through third-party providers)',
        '• Usage data and preferences',
      ],
    },
    {
      title: '2. How We Use Your Information',
      content: [
        'We use the information we collect to:',
        '• Provide, maintain, and improve our services',
        '• Match you with potential co-founders based on your preferences',
        '• Facilitate communication and collaboration within workspaces',
        '• Process payments and manage subscriptions',
        '• Send you updates, notifications, and support communications',
        '• Analyze usage patterns to improve our platform',
      ],
    },
    {
      title: '3. Information Sharing',
      content: [
        'We do not sell your personal information. We may share your information only in the following circumstances:',
        '• With other users within your workspace (as necessary for collaboration)',
        '• With service providers who assist us in operating our platform (under strict confidentiality agreements)',
        '• When required by law or to protect our rights',
        '• With your explicit consent',
      ],
    },
    {
      title: '4. Data Security',
      content: [
        'We implement industry-standard security measures to protect your information, including:',
        '• Encryption of data in transit and at rest',
        '• Secure authentication and access controls',
        '• Regular security audits and updates',
        '• Limited access to personal data on a need-to-know basis',
      ],
    },
    {
      title: '5. Your Rights',
      content: [
        'You have the right to:',
        '• Access and review your personal information',
        '• Correct inaccurate or incomplete information',
        '• Request deletion of your account and data',
        '• Opt-out of certain communications',
        '• Export your data',
      ],
    },
    {
      title: '6. Cookies and Tracking',
      content: [
        'We use cookies and similar technologies to:',
        '• Maintain your session and preferences',
        '• Analyze platform usage and performance',
        '• Provide personalized experiences',
        'You can control cookie preferences through your browser settings.',
      ],
    },
    {
      title: '7. Third-Party Services',
      content: [
        'Our platform integrates with third-party services including:',
        '• Authentication providers (Clerk)',
        '• Payment processors (Polar)',
        '• Cloud storage and database services (Supabase)',
        'These services have their own privacy policies governing data handling.',
      ],
    },
    {
      title: '8. Data Retention',
      content: [
        'We retain your information for as long as necessary to:',
        '• Provide our services to you',
        '• Comply with legal obligations',
        '• Resolve disputes and enforce agreements',
        'You may request deletion of your data at any time.',
      ],
    },
    {
      title: '9. Children\'s Privacy',
      content: [
        'Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.',
      ],
    },
    {
      title: '10. Changes to This Policy',
      content: [
        'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date.',
      ],
    },
    {
      title: '11. Contact Us',
      content: [
        'If you have questions about this Privacy Policy or our data practices, please contact us through the feedback feature in the app or at support@guildspace.co',
      ],
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG }}>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{
              mb: 3,
              textTransform: 'none',
              color: SLATE_500,
              '&:hover': { color: TEAL, bgcolor: 'transparent' },
            }}
          >
            Back
          </Button>
          <Typography variant="h3" sx={{ fontWeight: 700, color: SLATE_900, mb: 1, fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: '-0.02em' }}>
            Privacy Policy
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_400 }}>
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>

        {/* Introduction */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="body1" sx={{ color: SLATE_500, lineHeight: 1.8, mb: 2 }}>
            At Guild Space, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </Typography>
          <Typography variant="body1" sx={{ color: SLATE_500, lineHeight: 1.8 }}>
            By using Guild Space, you agree to the collection and use of information in accordance with this policy.
          </Typography>
        </Box>

        {/* Sections */}
        {sections.map((section, index) => (
          <Box key={index} sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900, mb: 2, fontSize: '1.25rem' }}>
              {section.title}
            </Typography>
            <Box sx={{ pl: 2 }}>
              {section.content.map((item, i) => (
                <Typography
                  key={i}
                  variant="body2"
                  sx={{
                    color: SLATE_500,
                    lineHeight: 1.8,
                    mb: item.startsWith('•') ? 1 : 1.5,
                    fontSize: '0.95rem',
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Box>
            {index < sections.length - 1 && <Divider sx={{ mt: 4, borderColor: SLATE_200 }} />}
          </Box>
        ))}

        {/* Footer note */}
        <Box sx={{
          mt: 6, p: 3, borderRadius: 2,
          bgcolor: alpha(TEAL, 0.05), border: '1px solid', borderColor: alpha(TEAL, 0.2),
        }}>
          <Typography variant="body2" sx={{ color: SLATE_500, lineHeight: 1.8 }}>
            This Privacy Policy is effective as of the date listed above and applies to all users of Guild Space. Your continued use of our platform after any changes constitutes acceptance of the updated policy.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
