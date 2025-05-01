# 🌟 GoGenie: AI-Powered Venue Recommendation Platform

GoGenie is a full-stack web application designed to deliver personalized venue recommendations based on user preferences and real-time geolocation. By integrating machine learning insights and the Foursquare Places API, it offers curated suggestions for entertainment, dining, and lifestyle venues.

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
