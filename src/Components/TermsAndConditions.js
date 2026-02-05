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

const TermsAndConditions = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: [
        'By accessing and using Guild Space, you accept and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our platform.',
      ],
    },
    {
      title: '2. Description of Service',
      content: [
        'Guild Space is a platform that facilitates:',
        '• Co-founder matching and discovery',
        '• Workspace collaboration tools',
        '• Equity calculation and agreement generation',
        '• Advisor marketplace connections',
        '• Investor networking opportunities',
        'We provide tools and infrastructure to help founders build successful partnerships.',
      ],
    },
    {
      title: '3. User Accounts',
      content: [
        'To use Guild Space, you must:',
        '• Be at least 18 years of age',
        '• Provide accurate and complete information',
        '• Maintain the security of your account',
        '• Not share your account credentials',
        '• Notify us immediately of any unauthorized access',
        'You are responsible for all activities that occur under your account.',
      ],
    },
    {
      title: '4. User Conduct',
      content: [
        'You agree not to:',
        '• Use the platform for any illegal or unauthorized purpose',
        '• Harass, abuse, or harm other users',
        '• Post false, misleading, or fraudulent information',
        '• Violate any applicable laws or regulations',
        '• Interfere with or disrupt the platform\'s operation',
        '• Attempt to gain unauthorized access to any part of the platform',
        '• Use automated systems to access the platform without permission',
      ],
    },
    {
      title: '5. Content and Intellectual Property',
      content: [
        '• You retain ownership of content you create and share on the platform',
        '• By using Guild Space, you grant us a license to use, display, and distribute your content as necessary to provide our services',
        '• You represent that you have the right to share any content you post',
        '• Guild Space\'s platform, design, and proprietary tools are protected by intellectual property laws',
        '• You may not copy, modify, or create derivative works of our platform without permission',
      ],
    },
    {
      title: '6. Equity and Financial Information',
      content: [
        '• Equity calculations and scenarios are provided for informational purposes only',
        '• We do not provide legal, financial, or tax advice',
        '• You should consult with qualified professionals before making equity decisions',
        '• Generated agreements are templates and should be reviewed by legal counsel',
        '• We are not responsible for the outcomes of equity agreements or partnerships',
      ],
    },
    {
      title: '7. Advisor Marketplace',
      content: [
        '• Advisors are independent third parties, not employees or agents of Guild Space',
        '• We facilitate connections but do not guarantee advisor quality or outcomes',
        '• Equity arrangements between founders and advisors are separate agreements',
        '• We are not party to advisor-founder relationships or disputes',
        '• Advisor fees and equity terms are determined by the parties involved',
      ],
    },
    {
      title: '8. Subscription and Payments',
      content: [
        '• Subscription fees are billed in advance on a monthly or annual basis',
        '• All fees are non-refundable except as required by law',
        '• We reserve the right to change pricing with 30 days notice',
        '• Failure to pay may result in suspension or termination of your account',
        '• Refunds are handled on a case-by-case basis',
      ],
    },
    {
      title: '9. Termination',
      content: [
        'We may terminate or suspend your account immediately if you:',
        '• Violate these Terms and Conditions',
        '• Engage in fraudulent or illegal activity',
        '• Fail to pay required fees',
        '• You may terminate your account at any time through your account settings',
        '• Upon termination, your right to use the platform ceases immediately',
        '• We may delete your data in accordance with our Privacy Policy',
      ],
    },
    {
      title: '10. Disclaimers',
      content: [
        '• Guild Space is provided "as is" without warranties of any kind',
        '• We do not guarantee the accuracy, completeness, or usefulness of any information',
        '• We do not guarantee successful matches or partnerships',
        '• We are not responsible for disputes between users',
        '• We do not guarantee uninterrupted or error-free service',
      ],
    },
    {
      title: '11. Limitation of Liability',
      content: [
        'To the maximum extent permitted by law:',
        '• Guild Space shall not be liable for any indirect, incidental, or consequential damages',
        '• Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim',
        '• We are not liable for losses resulting from user interactions or partnerships',
        '• We are not liable for third-party services or content',
      ],
    },
    {
      title: '12. Indemnification',
      content: [
        'You agree to indemnify and hold Guild Space harmless from any claims, damages, or expenses arising from:',
        '• Your use of the platform',
        '• Your violation of these Terms',
        '• Your violation of any rights of another user',
        '• Content you post or share',
      ],
    },
    {
      title: '13. Dispute Resolution',
      content: [
        '• Any disputes will be resolved through good faith negotiation',
        '• If negotiation fails, disputes will be resolved through binding arbitration',
        '• You waive your right to participate in class-action lawsuits',
        '• These Terms are governed by applicable laws',
      ],
    },
    {
      title: '14. Changes to Terms',
      content: [
        'We reserve the right to modify these Terms at any time. We will notify users of material changes by:',
        '• Posting the updated Terms on this page',
        '• Updating the "Last Updated" date',
        '• Sending notifications to registered users',
        'Continued use of the platform after changes constitutes acceptance of the new Terms.',
      ],
    },
    {
      title: '15. Contact Information',
      content: [
        'If you have questions about these Terms and Conditions, please contact us through the feedback feature in the app or at support@guildspace.co',
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
            Terms and Conditions
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_400 }}>
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>

        {/* Introduction */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="body1" sx={{ color: SLATE_500, lineHeight: 1.8, mb: 2 }}>
            Welcome to Guild Space. These Terms and Conditions govern your access to and use of our platform. Please read these terms carefully before using our services.
          </Typography>
          <Typography variant="body1" sx={{ color: SLATE_500, lineHeight: 1.8 }}>
            By creating an account or using Guild Space, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access our platform.
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
            These Terms and Conditions are effective as of the date listed above. Your continued use of Guild Space after any changes constitutes acceptance of the updated Terms.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default TermsAndConditions;
