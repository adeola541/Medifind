const axios = require('axios');

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

const fetchPlaces = async (lat, lng, radius = 15000) => {
    if (!FOURSQUARE_API_KEY) {
        console.warn("FOURSQUARE_API_KEY missing");
        return null; // Fallback to OSM
    }

    const options = {
        method: 'GET',
        url: 'https://api.foursquare.com/v3/places/search',
        params: {
            ll: `${lat},${lng}`,
            radius: radius,
            categories: '17072,15014,15017,15000', // Drugstore, Hospital, Clinic, Alternative Health
            limit: 50,
            fields: 'fsq_id,name,location,distance,rating,stats,photos'
        },
        headers: {
            accept: 'application/json',
            Authorization: FOURSQUARE_API_KEY
        }
    };

    try {
        console.log(`[FSQ] Searching at ${lat},${lng} radius=${radius}...`);
        const response = await axios.request(options);

        const count = response.data?.results?.length || 0;
        console.log(`[FSQ] Found ${count} results`);

        if (!response.data || !response.data.results) return [];

        return response.data.results.map(place => {
            // Foursquare Image Logic
            let imageUrl = null;
            if (place.photos && place.photos.length > 0) {
                const p = place.photos[0];
                imageUrl = `${p.prefix}400x400${p.suffix}`;
            }

            return {
                id: place.fsq_id,
                name: place.name,
                address: place.location.formatted_address || place.location.address || 'Address unavailable',
                latitude: place.location.lat || lat, // fallback if missing
                longitude: place.location.lng || lng,
                distance: place.distance / 1000, // meters to km
                rating: place.rating ? (place.rating / 2) : 4.0, // FSQ is 0-10, app uses 0-5
                user_ratings_total: place.stats.total_ratings || 0,
                types: ['Pharmacy'],
                source: 'foursquare',
                image: imageUrl
            };
        });

    } catch (error) {
        console.error("Foursquare API Error:", error.response?.data || error.message);
        // Throwing error causes fallback to OSM in pharmacyController
        throw error;
    }
};

const fetchPlaceTips = async (fsq_id) => {
    if (!FOURSQUARE_API_KEY) return [];

    const options = {
        method: 'GET',
        url: `https://api.foursquare.com/v3/places/${fsq_id}/tips`,
        params: {
            limit: 10,
            fields: 'text,created_at'
        },
        headers: {
            accept: 'application/json',
            Authorization: FOURSQUARE_API_KEY
        }
    };

    try {
        const response = await axios.request(options);
        return response.data || [];
    } catch (error) {
        console.error("Foursquare Tips Error:", error.response?.data || error.message);
        return [];
    }
};

module.exports = { fetchPlaces, fetchPlaceTips };
