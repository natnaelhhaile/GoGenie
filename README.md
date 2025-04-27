⸻

GoGenie | AI-Powered Smart Venue Recommendation System

🚀 Connect. Explore. Experience.

GoGenie is an AI-powered venue recommendation platform that personalizes real-world experiences for users based on their tastes, moods, and location.
Whether you’re searching for a cozy café, a trending restaurant, or fun weekend plans — GoGenie brings the best venues directly to your fingertips.

⸻

📌 Project Overview

GoGenie combines the power of OpenAI and Foursquare APIs to deliver smart, contextual, and location-aware recommendations.
It understands your hobbies, food preferences, and lifestyle themes to suggest real venues near you — personalized like never before.

✨ Built With:
	•	✅ React.js (Frontend)
	•	✅ Node.js + Express (Backend)
	•	✅ MongoDB Atlas (Database)
	•	✅ Firebase (Authentication)
	•	✅ OpenAI API (Smart Preference Interpretation)
	•	✅ Foursquare API (Live Venue Data)

⸻

🎯 Key Features

✅ AI-Powered Personalization

Transforms your hobbies, food choices, and lifestyle interests into meaningful venue recommendations via AI-enhanced queries.

✅ Smart Search with Priority Scoring

Search by name, category, or tags — prioritized by your preferences, feedback, and proximity.

✅ “Near Me” Discovery

One-tap smart search for venues around your current location (within 5 km), sorted closest to farthest.

✅ “Because You Liked” Personalized Suggestions

Tailored venue picks based on your previous likes and preferences.

✅ Dynamic Featured Venues

A handpicked, rotating selection of trending venues from your area.

✅ Favorites & Feedback

Like, dislike, and save venues you love for easy access anytime.

✅ Fully Mobile-Responsive Design

Optimized for a fast, seamless, and beautiful mobile-first browsing experience.

✅ Caching & Optimization

Venues and preferences are intelligently cached in MongoDB to minimize redundant API calls and enhance performance.

⸻

🛠️ Installation & Setup

1. Clone the Repository:

git clone https://github.com/natnaelhhaile/GoGenie.git
cd GoGenie

2. Install Dependencies:

npm install

3. Set Up Environment Variables:
Create a .env file in both /frontend and /backend directories:

REACT_APP_BACKEND_URL=http://localhost:5000
FIREBASE_API_KEY=your_firebase_api_key
FOURSQUARE_API_KEY=your_foursquare_api_key
OPENAI_API_KEY=your_openai_api_key
MONGO_URI=your_mongodb_connection_string

4. Start the Backend:

cd backend
npm start

5. Start the Frontend:

cd frontend
npm start



⸻

📌 Feature Breakdown

🔐 Authentication (Firebase)
	•	Secure user signup/login with email & password as well as social login with Google.
	•	Persistent user sessions with auto-login support.
	•	Token expiration after 3 hours of login.
	•	User profile preferences auto-loaded after login.

🧠 AI-Powered Recommendations
	•	Converts user preferences into smart, contextual queries.
	•	Fetches real venue data through Foursquare.
	•	Uses OpenAI for smarter matching beyond basic keywords.
	•	AI-chatbot for personalized venue recommendation upon natural language requests.

📍 Smart Venue Discovery
	•	Explore real venues filtered by proximity, category, hobbies, and lifestyle preferences.
	•	“Near Me” venues dynamically sorted by closest first.
	•	Full category-based filtering system.

❤️ Favorites & Feedback
	•	Save your favorite places to your personal list.
	•	Like or dislike venues to influence future recommendations.
	•	“Because You Liked” section tailored to your taste.

📦 Intelligent Caching
	•	Saves recommended venues and preferences locally.
	•	Reduces redundant API calls.
	•	Boosts performance and reduces data load.

⸻

🧩 Project Structure

GoGenie/
│── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI Components
│   │   ├── pages/           # Main Screens (Dashboard, Search, Profile)
│   │   ├── assets/          # Static Images & Icons
│   │   ├── firebase.js      # Firebase Authentication Setup
│   ├── .env                 # Frontend Environment Variables
│
│── backend/
│   ├── models/              # Mongoose Schemas (Users, Preferences, Recommendations)
│   ├── routes/              # Express Routes (Auth, Recommendations, Favorites)
│   ├── services/            # OpenAI + Foursquare Integrations
│   ├── config/              # Database & Middleware Setup
│   ├── server.js            # Main Server Entry Point
│   ├── .env                 # Backend Environment Variables
│
│── README.md                # Project Documentation
│── .gitignore               # Ignored Files & Folders
│── .env.example             # Sample .env File



⸻

🚀 Deployment Plan (In Progress)
	•	Frontend: Vercel / Netlify
	•	Backend: Google Cloud Run / AWS / Render
	•	Database: MongoDB Atlas (Cloud Database)

⸻

📈 Future Enhancements
	•	✅ Enable local users to contribute to Venue Ratings & Reviews (coming soon!)
	•	✅ Real-Time Live Geolocation Filtering
	•	✅ Social Sharing of Recommendations
	•	✅ Dark Mode & Accessibility Improvements

⸻

👤 Authors
	•	Natnael Haile — Developer
	•	Siem Hagos — Developer

⸻

🌟 Show Your Support!

If you like GoGenie, consider giving it a ⭐️ star on GitHub — it really helps us grow!

⸻