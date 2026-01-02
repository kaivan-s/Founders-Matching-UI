import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * FAQ Schema Component for FAQ structured data
 * Usage: <FAQSchema faqs={[{question: "...", answer: "..."}]} />
 */
const FAQSchema = ({ faqs = [] }) => {
  if (!faqs || faqs.length === 0) return null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
    </Helmet>
  );
};

export default FAQSchema;

