import React from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'SkillSwap - Lerne und teile Fähigkeiten',
  description = 'Entdecke neue Fähigkeiten, teile dein Wissen und verbinde dich mit Lernenden und Lehrenden in unserer Community.',
  keywords = ['Skills', 'Lernen', 'Lehren', 'Online-Unterricht', 'Skill Exchange', 'Weiterbildung'],
  author = 'SkillSwap',
  image = '/og-image.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  publishedTime,
  modifiedTime,
}) => {
  const siteName = 'SkillSwap';
  const fullTitle = title.includes('SkillSwap') ? title : `${title} | ${siteName}`;
  const keywordsContent = keywords?.length ? keywords.join(', ') : undefined;

  return (
    <>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywordsContent && <meta name="keywords" content={keywordsContent} />}
      <meta name="author" content={author} />
      {url && <link rel="canonical" href={url} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {url && <meta name="twitter:url" content={url} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': type === 'profile' ? 'Person' : type === 'article' ? 'Article' : 'WebSite',
            name: fullTitle,
            description,
            url,
            image,
            author: {
              '@type': 'Organization',
              name: siteName,
            },
            ...(publishedTime && { datePublished: publishedTime }),
            ...(modifiedTime && { dateModified: modifiedTime }),
          }),
        }}
      />
    </>
  );
};

export default SEO;
