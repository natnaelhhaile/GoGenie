# 🌟 GoGenie: AI-Powered Venue Recommendation Platform

GoGenie is a mobile-first full-stack web app designed to deliver personalized venue recommendations based on user preferences and real-time geolocation. By integrating machine learning insights and the Foursquare Places API, it offers curated suggestions for entertainment, dining, and lifestyle venues.

---

## 🔑 Features

- 🔐 **User Authentication**  
  Secure sign-up and login flow using Firebase Authentication (with Drop-in UI).

- 📄 **Profile Setup**  
  Users enter personal info (name, age, gender, etc.) and select preferences for:
  - Hobbies
  - Food
  - Themes
  - Lifestyle

- 📍 **Geolocation Support**  
  Captures latitude & longitude using the browser’s Geolocation API and stores it along with a textual location (city/state) for fallback.

- 🧠 **AI-Based Recommendations**  
  Uses user tag weights to generate optimized Foursquare search queries and filters results by a relevancy score (threshold: 70%).

- 💬 **Chat Assistant**  
  React-based interface for users to interact with the assistant and receive recommendations.

- 🔍 **Search & Explore**  
  Mobile-friendly bottom navigation allows users to explore venues by category or tags.

- ❤️ **Favorites Management**  
  Users can like/save venues to their favorites for future reference.

- 📢 **Feedback System**  
  Simple feedback form allows users to help improve recommendations.

---

## 🧱 Tech Stack

| Layer           | Technology                    |
|----------------|-------------------------------|
| Frontend       | React (HTML/CSS)              |
| Backend        | Node.js + Express             |
| Authentication | Firebase Authentication       |
| Database       | MongoDB + Mongoose            |
| APIs           | Foursquare Places API, OpenAI |
| Dev Tools      | Nodemon, Axios, ESLint, dotenv|

---

## 🧠 Recommendation Engine

The GoGenie recommendation engine curates personalized venue suggestions based on user preferences, geolocation, and interactive feedback. It combines semantic tagging, cosine similarity, and real-time API queries to generate and refine recommendations.

---

### 🛠 Components

#### 1. User & Preferences
- `POST /check-new-user`: Initializes new user profile if needed.
- `GET /preferences`: Retrieves stored user preferences.
- `POST /preferences`: Creates preferences and builds tag weights.
- `PUT /preferences`: Updates interest-based preferences.
- `PUT /details`: Updates demographic and location fields.
- `GET /summary`: Uses AI to generate a summary from preferences.

---

#### 2. Recommendation Engine
- `GET /generate-recommendations`
  - Generates search queries using `tagWeights` and OpenAI.
  - Fetches venues from Foursquare API.
  - Calculates `priorityScore` using:
    - Cosine similarity (60%)
    - Proximity (20%)
    - Rating (20%)
  - Saves venues in `Recommendation`, user-venue scores in `UserVenueScore`.

- `GET /cached-recommendations`
  - Returns sorted venues by `priorityScore`.
  - Paginates with `offset` and `limit`.
  - Aggregates top categories.

- `GET /categories`
  - Analyzes venue history to rank categories.

- `GET /featured`
  - Returns top 5 venues based on user score or fallback to popularity.

- `GET /because-you-liked`
  - Recommends venues similar to a user’s top liked one by tags/categories.

- `GET /nearby`
  - Filters user-linked venues within 10km of user’s coordinates.

- `GET /search`
  - Regex-based search across multiple venue fields.
  - Ranks results by `priorityScore` or fallback.

- `GET /details/:venue_id`
  - Fetches rating, hours, stats, and tips of a venue from DB.

---

#### 3. Feedback System
- `POST /feedback`
  - Adjusts `tagWeights` using feedback (`up`/`down`) with decay factor.
  - Updates `priorityScore` for the venue.
  - Adds user-supported tags to venue if >= 2 users upvote.

- `GET /feedback/:venue_id`
  - Returns the current feedback status for a venue.

---

### ⚙️ Scoring Formula

```js
priorityScore = (
  cosineSimilarity(user, venue) * 0.6 +
  proximityScore(distance) * 0.2 +
  ratingScore(venue.rating) * 0.2
).toFixed(3);
```

---

## 📦 Storage Schema

| Collection           | Purpose                                |
|----------------------|----------------------------------------|
| `User`               | Stores user tagWeights                 |
| `Preferences`        | Profile preferences, geolocation       |
| `Recommendation`     | Unique venues pulled from Foursquare   |
| `UserVenueScore`     | User-specific venue score + feedback   |
| `VenueTagVote`       | Tracks collective tag suggestions      |

---

## 🔁 Feedback Loop

1. User provides feedback (`up` or `down`)
2. Tag weights adjusted with decay + polarity
3. Score recalculated → better future recommendations
4. Shared tags voted into venue metadata over time

---

## 🧠 Powered By
- [Firebase Auth](https://firebase.google.com/)
- [MongoDB + Mongoose](https://mongoosejs.com/)
- [Foursquare Places API](https://developer.foursquare.com/)
- [OpenAI](https://platform.openai.com/)

---

## 🚀 Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/natnaelhhaile/gogenie.git
   ```

2. **Navigate to the Project Directory**
   ```bash
   cd gogenie
   ```

3. **Install Backend & Frontend Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Environment Configuration**

   > ⚠️ Make sure Firebase is properly configured in the [Firebase Console](https://console.firebase.google.com/), and that all keys in `.env` files match your project credentials.

   Create a `.env` file in the `backend/` directory and add:
   ```env
   MONGO_URI=your_mongo_connection_string

   FIREBASE_API_KEY=your_firebase_key
   FIREBASE_AUTH_DOMAIN=your_firebase_credential
   FIREBASE_PROJECT_ID=your_firebase_credential
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_credential
   FIREBASE_APP_ID=your_firebase_credential
   FIREBASE_MEASUREMENT_ID=your_firebase_credential

   OPENAI_API_KEY=your_openai_key

   FOURSQUARE_API_KEY=your_foursquare_key

   PORT=your_backend_port_number
   ```

   Create a `.env` file in the `frontend/` directory and add:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_firebase_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_credential
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_credential
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_credential
   REACT_APP_FIREBASE_APP_ID=your_firebase_credential
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_credential

   REACT_APP_BACKEND_URL=your_backend_url
   ```

5. **Run the Application**
   ```bash
   # In the backend directory
   npm run dev

   # In another terminal, run frontend
   cd frontend
   npm start
   ```

---

## 📁 Project Structure

```
gogenie/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── firebase.js
│   │   ├── app.js
│   │   ├── app.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── .env
└── README.md
```

---

## 🤝 Contributing

Contributions, suggestions, and issues are welcome.  
Please fork the repo and submit a pull request!

---

## 📜 License

MIT License © 2025 [Natnael Haile](https://github.com/natnaelhhaile) | [Siem Hagos](https://github.com/siezer-5997)
