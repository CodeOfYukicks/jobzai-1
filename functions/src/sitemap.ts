import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

export const sitemap = functions.https.onRequest(async (req, res) => {
    try {
        const baseUrl = 'https://cubbbe.com';
        const routes = [
            { path: '/', changefreq: 'weekly', priority: '1.0' },
            { path: '/blog', changefreq: 'weekly', priority: '0.8' },
            { path: '/login', changefreq: 'monthly', priority: '0.6' },
            { path: '/signup', changefreq: 'monthly', priority: '0.7' },
            { path: '/select-plan', changefreq: 'monthly', priority: '0.6' },
            { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
            { path: '/terms', changefreq: 'yearly', priority: '0.3' },
            { path: '/cookies', changefreq: 'yearly', priority: '0.3' },
            { path: '/faq', changefreq: 'monthly', priority: '0.6' },
        ];

        // Fetch published blog posts
        const postsSnapshot = await db.collection('blog_posts')
            .where('status', '==', 'published')
            .get();

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add static routes
        routes.forEach(route => {
            xml += `
  <url>
    <loc>${baseUrl}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
        });

        // Add blog posts
        postsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.slug) {
                // Default to monthly update for old posts, or use updatedAt if available
                const lastMod = data.updatedAt ? new Date(data.updatedAt.toDate()).toISOString() : null;

                xml += `
  <url>
    <loc>${baseUrl}/blog/${data.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>${lastMod ? `
    <lastmod>${lastMod}</lastmod>` : ''}
  </url>`;
            }
        });

        xml += `
</urlset>`;

        res.set('Content-Type', 'application/xml');
        // Cache for 24 hours
        res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        res.status(200).send(xml);

    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
});
