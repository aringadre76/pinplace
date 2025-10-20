export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { q, limit = 5 } = req.query;

  if (!q) {
    res.status(400).json({ error: 'Query parameter "q" is required' });
    return;
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=${limit}&addressdetails=1&extratags=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'pinplace-app/1.0 (https://pinplace.vercel.app)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter and format the results
    const filteredData = data
      .filter((item) => 
        item.class === 'place' || 
        item.type === 'city' || 
        item.type === 'town' || 
        item.type === 'village' ||
        item.type === 'administrative' ||
        (item.address && (item.address.city || item.address.town || item.address.village))
      )
      .map((item) => ({
        name: item.name || item.display_name.split(',')[0],
        country: item.address?.country || 'Unknown',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name
      }))
      .slice(0, parseInt(limit));

    res.status(200).json(filteredData);
  } catch (error) {
    console.error('Error fetching from Nominatim:', error);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
}
