import { Helmet } from 'react-helmet-async';

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
  url = window.location.href,
  type = 'website',
  publishedTime,
  modifiedTime,
}) => {
  const siteName = 'SkillSwap';
  const fullTitle = title.includes('SkillSwap') ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Schema.org markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': type === 'profile' ? 'Person' : type === 'article' ? 'Article' : 'WebSite',
          name: fullTitle,
          description: description,
          url: url,
          image: image,
          author: {
            '@type': 'Organization',
            name: siteName,
          },
          ...(publishedTime && { datePublished: publishedTime }),
          ...(modifiedTime && { dateModified: modifiedTime }),
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
