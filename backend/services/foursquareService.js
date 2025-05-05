import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const API_KEY = process.env.FOURSQUARE_API_KEY;

const fetchFoursquareVenuesByCoords = async (queries, { lat, lng, radius = 40000 }) => {
  const fields = 'fsq_id,name,location,categories,distance,link,rating,photos,features,popularity,stats,hours,tips';
  let allVenues = [];

  for (const query of queries) {
    try {
      const response = await axios.get("https://api.foursquare.com/v3/places/search", {
        headers: { Authorization: API_KEY, Accept: "application/json" },
        params: {
          query: query,
          fields: fields,
          ll: `${lat},${lng}`,
          radius: radius,
          limit: 20
        }
      });

      if (response.data.results) {
        allVenues = [...allVenues, ...response.data.results];
      }
    } catch (error) {
      console.error(`❌ Error fetching venues for query: ${query}`, error.message);
    }
  }

  return allVenues;
};

const fetchVenuePhotos = async (fsq_id) => {
  const url = `https://api.foursquare.com/v3/places/${fsq_id}/photos`;
  const headers = {
    Accept: "application/json",
    Authorization: API_KEY
  };

  try {
    const response = await axios.get(url, { headers });
    const photos = response.data;

    const photoURLs = photos.slice(0, 5).map(photo =>
      `${photo.prefix}original${photo.suffix}`
    );

    return photoURLs;
  } catch (error) {
    console.error(`❌ Error fetching photos for venue ${fsq_id}:`, error.message);
    return [];
  }
};

export {
  fetchFoursquareVenuesByCoords,
  fetchVenuePhotos
};