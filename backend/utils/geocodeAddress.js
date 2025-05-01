import axios from "axios";

/**
 * Geocodes a raw address using the OpenStreetMap Nominatim API.
 * Returns { lat, lng } if successful, or null if not found.
 * @param {string} address - Full address to geocode
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
export default async function geocodeAddress(address) {
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: address,
        format: "json",
        addressdetails: 1,
        limit: 1,
      },
      headers: {
        "User-Agent": `GoGenieApp/1.0 (${process.env.OSM_EMAIL_ADDRESS})`,
      },
    });
    console.log("osm email address:", process.env.OSM_EMAIL_ADDRESS)

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
    }

    return null;
  } catch (err) {
    console.error("❌ Geocoding error:", err.message);
    return null;
  }
}