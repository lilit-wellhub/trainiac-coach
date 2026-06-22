// Vercel serverless proxy — forwards createCxUser calls from Google Apps Script
// to admin.trainiac.fit, bypassing CloudFront WAF which blocks Google datacenter IPs.

const PARSE_APP_ID = 'RbJWfLS2nf6tuQvMxJGZSGWTTzX783k11HPhz4pO';
const PARSE_BASE   = 'https://admin.trainiac.fit';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionToken, firstName, lastName, email, password, region } = req.body || {};

  if (!sessionToken) return res.status(401).json({ error: 'Missing sessionToken' });
  if (!email)        return res.status(400).json({ error: 'Missing email' });

  try {
    const response = await fetch(`${PARSE_BASE}/parse/functions/createCxUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': PARSE_APP_ID,
        'X-Parse-Session-Token': sessionToken
      },
      body: JSON.stringify({ firstName, lastName, email, password, region })
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
}
