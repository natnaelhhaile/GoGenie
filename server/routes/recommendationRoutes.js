const express = require("express");
const mongoose = require("mongoose");
const Preferences = require("../models/Preferences"); 
const Recommendation = require("../models/Recommendation");
const { generateFoursquareQueries } = require("../services/openAIService");
const { fetchFoursquareVenues, fetchVenuePhotos } = require("../services/foursquareService");

const router = express.Router();

// ✅ Smart Fetch: Checks MongoDB before fetching from Foursquare
router.get("/user-venues/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
  
      // ✅ Check if there are existing recommendations in MongoDB
      const cachedVenues = await Recommendation.find({ user: userId }).limit(10);
  
      if (cachedVenues.length > 0) {
        console.log("✅ Returning cached venues from MongoDB");
        return res.status(200).json({ recommendations: cachedVenues });
      }
  
      console.log("❌ No cached venues found. Fetching from Foursquare...");
  
      // ✅ Fetch user preferences
      const userPreferences = await Preferences.findOne({ user: userId });
      if (!userPreferences) {
        return res.status(404).json({ message: "No preferences found for this user" });
      }
  
      // ✅ Generate queries from preferences
      const queries = await generateFoursquareQueries({
        hobbies: userPreferences.hobbies,
        foodPreferences: userPreferences.foodPreferences,
        thematicPreferences: userPreferences.thematicPreferences,
      });
  
      if (!queries || queries.length === 0) {
        return res.status(500).json({ message: "Failed to generate queries" });
      }
      console.log("no venues so proceeding");
      console.log(queries);
      // ✅ Fetch venues from Foursquare API
      const venues = await fetchFoursquareVenues(queries, userPreferences.location);
      if (!venues || venues.length === 0) {
        return res.status(404).json({ message: "No venues found" });
      }
      console.log("venues generated");
      // ✅ Save new venues to MongoDB
      const savedVenues = [];
      for (const venue of venues) {
        const existingVenue = await Recommendation.findOne({ venue_id: venue.fsq_id, user: userId });
        console.log("passed existingVenue", existingVenue);
        if (!existingVenue) {
          const photoURLs = await fetchVenuePhotos(venue.fsq_id); // get photos

          const newVenue = new Recommendation({
            venue_id: venue.fsq_id,
            name: venue.name,
            category: venue.categories?.[0]?.name || "Unknown",
            tags: venue.categories?.map((c) => c.name) || [],
            location: {
              address: venue.location.formatted_address,
              latitude: venue.geocodes?.main?.latitude,
              longitude: venue.geocodes?.main?.longitude,
            },
            link: venue.link,
            priority_score: 0,
            photos: photoURLs,
            distance: venue.distance,
            user: userId,
          });
          console.log("new venue saved: ", newVenue);
  
          await newVenue.save();
          savedVenues.push(newVenue);
          console.log("venue id: Siem", venue.fsq_id)
        }
      }
  
      console.log("✅ New venues fetched and stored.");
      return res.status(200).json({ recommendations: savedVenues });
  
    } catch (error) {
      console.error("❌ Error fetching recommendations:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  

module.exports = router;
