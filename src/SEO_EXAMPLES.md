# SEO Implementation Examples

## 1. Update App.js to include HelmetProvider

```javascript
// In src/index.js or App.js
import { HelmetProvider } from 'react-helmet-async';

// Wrap your app
<HelmetProvider>
  <App />
</HelmetProvider>
```

## 2. Landing Page Example

```javascript
import SEO from './components/SEO';
import FAQSchema from './components/FAQSchema';

const LandingPage = () => {
  const faqs = [
    {
      question: "How does Co-Build help me find a co-founder?",
      answer: "Co-Build uses compatibility matching and preference-based discovery to connect you with potential co-founders who share your vision, values, and complementary skills."
    },
    {
      question: "What makes Co-Build different from other matching platforms?",
      answer: "Co-Build goes beyond matching - we help you avoid ghosting, clarify equity splits upfront, and provide tools for building successful partnerships including accountability partner systems and workspace collaboration."
    },
    // ... more FAQs
  ];

  return (
    <>
      <SEO
        title="Find Your Perfect Co-Founder"
        description="Find your ideal co-founder with Co-Build. Our platform goes beyond matching - we help you avoid ghosting, clarify equity splits, and build successful partnerships."
        url="/"
        keywords="co-founder matching, find co-founder, startup partner, business partner"
      />
      <FAQSchema faqs={faqs} />
      {/* Rest of landing page */}
    </>
  );
};
```

## 3. Pricing Page Example

```javascript
import SEO from './components/SEO';
import BreadcrumbSchema from './components/BreadcrumbSchema';

const PricingPage = () => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Pricing", url: "/pricing" }
  ];

  return (
    <>
      <SEO
        title="Pricing Plans"
        description="Choose the right plan for your co-founder journey. Free, Pro, and Pro+ plans available with different features and limits."
        url="/pricing"
        keywords="co-founder platform pricing, founder matching cost, startup platform plans"
      />
      <BreadcrumbSchema items={breadcrumbs} />
      {/* Rest of pricing page */}
    </>
  );
};
```

## 4. Discovery Page Example

```javascript
import SEO from './components/SEO';

const SwipeInterface = () => {
  return (
    <>
      <SEO
        title="Discover Co-Founders"
        description="Browse and discover potential co-founders based on your preferences. Swipe through profiles and find your perfect match."
        url="/discover"
        noindex={true} // If you want to prevent indexing of discovery pages
      />
      {/* Rest of discovery page */}
    </>
  );
};
```

## 5. Workspace Page Example

```javascript
import SEO from './components/SEO';
import BreadcrumbSchema from './components/BreadcrumbSchema';

const WorkspacePage = ({ workspaceId, workspaceName }) => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Workspaces", url: "/workspaces" },
    { name: workspaceName || "Workspace", url: `/workspace/${workspaceId}` }
  ];

  return (
    <>
      <SEO
        title={`${workspaceName || 'Workspace'} - Co-Build`}
        description={`Collaborate with your co-founder in ${workspaceName || 'your workspace'}. Manage equity, track KPIs, make decisions, and build your startup together.`}
        url={`/workspace/${workspaceId}`}
        noindex={true} // Private workspaces shouldn't be indexed
      />
      <BreadcrumbSchema items={breadcrumbs} />
      {/* Rest of workspace page */}
    </>
  );
};
```

## 6. Accountability Partner Landing Page

```javascript
import SEO from './components/SEO';
import FAQSchema from './components/FAQSchema';

const AccountabilityPartnerLanding = () => {
  const faqs = [
    {
      question: "What is an accountability partner?",
      answer: "An accountability partner is an experienced advisor who helps founders stay on track, make better decisions, and achieve their goals through regular check-ins and guidance."
    },
    {
      question: "How do I become an accountability partner?",
      answer: "Sign up as an accountability partner, complete your profile, and start connecting with founders who need guidance and support."
    }
  ];

  return (
    <>
      <SEO
        title="Become an Accountability Partner"
        description="Help founders succeed by becoming an accountability partner. Guide startups, provide expertise, and earn while making an impact."
        url="/accountability-partner"
        keywords="accountability partner, startup advisor, founder mentor, startup guidance"
      />
      <FAQSchema faqs={faqs} />
      {/* Rest of page */}
    </>
  );
};
```

