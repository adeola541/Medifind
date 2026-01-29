const axios = require('axios');

// Geocode Address using Nominatim (OpenStreetMap)
const geocodeAddress = async (req, res) => {
    try {
        const { address } = req.query;

        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        const nominatimUrl = `https://nominatim.openstreetmap.org/search`;

        const response = await axios.get(nominatimUrl, {
            params: {
                q: address,
                format: 'json',
                limit: 1,
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'MediFind/1.0 (medifind-app-student-project)'
            }
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            return res.json({
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                displayName: result.display_name,
                address: result.address
            });
        } else {
            return res.status(404).json({ error: 'Location not found' });
        }

    } catch (error) {
        console.error("Geocoding Error:", error.message);
        res.status(500).json({ error: 'Geocoding service failed' });
    }
};

const reverseGeocode = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and Longitude are required' });
        }

        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse`;

        const response = await axios.get(nominatimUrl, {
            params: {
                lat,
                lon: lng,
                format: 'json',
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'MediFind/1.0 (medifind-app-student-project)'
            }
        });

        if (response.data) {
            const address = response.data.address;
            const formattedAddress = [];
            // Construct a readable address roughly matching Expo's format
            if (address.road) formattedAddress.push(address.road);
            if (address.city || address.town || address.village) formattedAddress.push(address.city || address.town || address.village);
            if (address.state) formattedAddress.push(address.state);
            if (address.country) formattedAddress.push(address.country);

            return res.json([{
                street: address.road || '',
                city: address.city || address.town || address.village || '',
                region: address.state || '',
                country: address.country || '',
                name: response.data.display_name
            }]);
        } else {
            return res.status(404).json({ error: 'Location not found' });
        }

    } catch (error) {
        console.error("Reverse Geocoding Error:", error.message);
        res.status(500).json({ error: 'Reverse geocoding service failed' });
    }
};

module.exports = { geocodeAddress, reverseGeocode };
