/**
 * SerpApi Google Maps Proxy Controller
 * Searches for places using SerpApi's Google Maps engine
 * and returns normalized results for the frontend.
 */

// Helper: Map Google Maps category/type to GreenSteps activity type
function mapCategory(type) {
  if (!type) return 'attraction';
  const lower = (typeof type === 'string' ? type : '').toLowerCase();
  if (lower.includes('restaurant') || lower.includes('cafe') || lower.includes('coffee') || 
      lower.includes('food') || lower.includes('bar') || lower.includes('bakery') ||
      lower.includes('nhà hàng') || lower.includes('quán')) {
    return 'dining';
  }
  if (lower.includes('hotel') || lower.includes('motel') || lower.includes('hostel') || 
      lower.includes('resort') || lower.includes('homestay') || lower.includes('lodging') ||
      lower.includes('khách sạn')) {
    return 'lodging';
  }
  return 'attraction';
}

exports.searchSerp = async (req, res, next) => {
  const { q, destination } = req.query;
  if (!q) {
    return res.status(400).json({ success: false, message: 'Thiếu từ khóa tìm kiếm (q)' });
  }

  try {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'SERPAPI_KEY chưa được cấu hình trên server.' });
    }

    const query = destination ? `${q} ${destination}` : q;
    const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&type=search&hl=vi&api_key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      // Fallback to Nominatim if SerpApi fails (quota exceeded, etc.)
      console.warn(`SerpApi returned ${response.status}, falling back to Nominatim...`);
      return await fallbackNominatim(q, destination, res);
    }

    const data = await response.json();

    if (!data.local_results || data.local_results.length === 0) {
      // Fallback to Nominatim if no results
      return await fallbackNominatim(q, destination, res);
    }

    const results = data.local_results.slice(0, 5).map(r => ({
      title: r.title || 'Không rõ tên',
      lat: r.gps_coordinates?.latitude || null,
      lng: r.gps_coordinates?.longitude || null,
      rating: r.rating || null,
      reviews: r.reviews || 0,
      address: r.address || '',
      thumbnail: r.thumbnail || null,
      type: r.type || '',
      hours: r.hours || null,
      category: mapCategory(r.type),
      source: 'google_maps'
    }));

    res.json(results);
  } catch (error) {
    console.error('SerpApi search error:', error.message);
    // Fallback to Nominatim on any error
    try {
      return await fallbackNominatim(q, destination, res);
    } catch (fallbackErr) {
      next(error);
    }
  }
};

/**
 * Fallback: Use OpenStreetMap Nominatim (free, unlimited) when SerpApi is unavailable
 */
async function fallbackNominatim(q, destination, res) {
  const query = destination ? `${q} ${destination}` : q;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'GreenSteps/1.0' }
  });
  const data = await response.json();

  const results = (data || []).map(r => ({
    title: r.display_name ? r.display_name.split(',')[0] : 'Không rõ tên',
    lat: parseFloat(r.lat) || null,
    lng: parseFloat(r.lon) || null,
    rating: null,
    reviews: 0,
    address: r.display_name || '',
    thumbnail: null,
    type: r.type || '',
    hours: null,
    category: mapCategory(r.type),
    source: 'nominatim'
  }));

  res.json(results);
}
