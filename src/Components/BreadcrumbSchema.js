import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Breadcrumb Schema Component for breadcrumb structured data
 * Usage: <BreadcrumbSchema items={[{name: "Home", url: "/"}, {name: "Page", url: "/page"}]} />
 */
const BreadcrumbSchema = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://founder-match.in${item.url}`
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
};

export default BreadcrumbSchema;

