import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    url?: string;
    image?: string;
    type?: string;
    noindex?: boolean;
}

const BASE_URL = 'https://cubbbe.com';
const DEFAULT_IMAGE = `${BASE_URL}/og/default.png`;

export default function SEO({
    title,
    description,
    url,
    image = DEFAULT_IMAGE,
    type = 'website',
    noindex = false,
}: SEOProps) {
    const canonicalUrl = url ? `${BASE_URL}${url}` : undefined;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{title}</title>
            <meta name="description" content={description} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="Cubbbe" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
}
