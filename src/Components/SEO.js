import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for dynamic meta tags per page
 * Usage: <SEO title="Page Title" description="Page description" />
 */
const SEO = ({
  title,
  description,
  keywords,
  image = 'https://founder-match.in/CoreTeam.png',
  url,
  type = 'website',
  noindex = false,
  structuredData,
}) => {
  const siteUrl = 'https://founder-match.in';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullTitle = title ? `${title} | CoreTeam` : 'CoreTeam - Find Your Perfect Co-Founder';
  const defaultDescription = 'Find your ideal co-founder with CoreTeam. Our platform goes beyond matching - we help you avoid ghosting, clarify equity splits, and build successful partnerships.';
  const metaDescription = description || defaultDescription;
  const defaultKeywords = 'co-founder, cofounder matching, find co-founder, startup partner, business partner, equity split, founder matching, startup collaboration, accountability partner';
  const metaKeywords = keywords || defaultKeywords;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="CoreTeam" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@foundermatch" />
      <meta name="twitter:site" content="@foundermatch" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

