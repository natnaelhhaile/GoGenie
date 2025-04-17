import { useEffect } from "react";

const TestFoursquarePhotos = () => {
  useEffect(() => {
    const fetchVenuePhotos = async () => {
    //   const FOURSQUARE_API_KEY = process.env.REACT_APP_FOURSQUARE_API_KEY;

      // Replace this fsq_id with one you already have in your data
      const testVenueId = "4cba72394495721ef88d507a";
    //   console.log("Testing Foursquare API:", process.env.REACT_APP_FOURSQUARE_API_KEY);

      try {
        const response = await fetch(`https://api.foursquare.com/v3/places/${testVenueId}/photos`, {
          headers: {
            Authorization: "fsq33/U/1q8l67tVxZKXFFpKHEpqj2L1m/MdyetOKxSNfhE=",
            accept: "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("📸 Venue Photos:", data);

        if (data.length > 0) {
          const imageUrl = `${data[0].prefix}original${data[0].suffix}`;
          console.log("First Image URL:", imageUrl);
        } else {
          console.log("No photos returned.");
        }

      } catch (err) {
        console.error("❌ Error fetching venue photos:", err);
      }
    };

    fetchVenuePhotos();
  }, []);

  return null; // No UI, just console test
};

export default TestFoursquarePhotos;
