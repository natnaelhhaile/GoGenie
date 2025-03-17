**<h1 align="center">GoGenie 🌍 | AI-Powered Venue Recommendation System</h1>**  

**<p align="center">🚀 Connect. Explore. Experience.</p>**  
A personalized recommendation platform that suggests real-world venues based on user preferences using OpenAI + Foursquare API.

---

## **📌 Project Overview**
**GoGenie** is a **smart venue recommendation system** that enhances social and dining experiences. It analyzes user preferences and **leverages AI & real-time location data** to recommend places like cafes, restaurants, and event spaces.  

✨ **Tech Stack:**  
✅ React (Frontend)  
✅ Node.js + Express (Backend)  
✅ MongoDB (Database)  
✅ Firebase (User Authentication)  
✅ OpenAI API (AI-powered preference queries)  
✅ Foursquare API (Real-world venue data)  

🎯 **Key Features:**  
✅ **AI-Driven Recommendations:** Tailored suggestions based on hobbies, food choices & thematic preferences.  
✅ **Foursquare API Integration:** Fetches real-world venues dynamically.  
✅ **User-Friendly Dashboard:** Interactive UI to explore and save recommended places.  
✅ **Location Intelligence:** Filters results based on user’s proximity.  
✅ **Preference-Based Personalization:** Custom venue filtering using machine learning & caching.  

---

## **🛠️ Installation & Setup**
**1️⃣ Clone the Repository**  
```sh
git clone https://github.com/yourusername/GoGenie.git
cd GoGenie
```

**2️⃣ Install Dependencies**  
```sh
npm install
```

**3️⃣ Set Up Environment Variables**  
Create a **.env** file in both frontend and backend folders and add:  
```
REACT_APP_BACKEND_URL=http://localhost:5000
FIREBASE_API_KEY=your_firebase_api_key
FOURSQUARE_API_KEY=your_foursquare_api_key
OPENAI_API_KEY=your_openai_api_key
MONGO_URI=your_mongodb_connection_string
```

**4️⃣ Start the Backend**  
```sh
cd backend
npm start
```

**5️⃣ Start the Frontend**  
```sh
cd frontend
npm start
```

---

## **📌 Features Breakdown**
### **🔑 Authentication (Firebase)**
- Secure **email/password login**.
- Persistent user sessions with Firebase Auth.
- Auto-fetch user preferences from **MongoDB** after login.

### **🧠 AI-Powered Recommendations (OpenAI + Foursquare)**
- Uses **OpenAI API** to transform user preferences into **Foursquare-compatible queries**.
- Retrieves **real venue data** from **Foursquare API**.
- **Caches recommendations** in **MongoDB** for efficient performance.

### **📍 Smart Venue Discovery**
- **Real-time venue recommendations** from Foursquare.
- Filters based on **location, distance, category & user interests**.
- **Renders places with images, categories & estimated distance.**

### **🖥️ Interactive Dashboard**
- **Displays user’s personalized places** in an elegant **grid layout**.
- Users can **view, save & revisit venues**.
- **Category-based filtering** for better discovery.

### **💾 Caching & Optimization**
- Uses MongoDB to **store recommended places** (avoiding redundant API calls).
- **Efficient data fetching** to enhance performance.

---

## **🖥️ Project Structure**
```
GoGenie/
│── frontend/                # React Frontend
│   ├── src/
│   │   ├── components/      # UI Components
│   │   ├── pages/           # Routes (Dashboard, Profile Setup)
│   │   ├── assets/          # Images & icons
│   │   ├── firebase.js      # Firebase authentication
│   ├── .env                 # Frontend Environment Variables
│   ├── package.json         # Frontend Dependencies
│
│── backend/                 # Express Backend
│   ├── models/              # Mongoose Schemas (Users, Preferences, Recommendations)
│   ├── routes/              # API Endpoints
│   ├── services/            # OpenAI & Foursquare API Calls
│   ├── config/              # MongoDB Connection & Firebase Config
│   ├── server.js            # Express App Entry
│   ├── .env                 # Backend Environment Variables
│   ├── package.json         # Backend Dependencies
│
│── README.md                # Documentation
│── .gitignore               # Git Ignore Rules
│── .env.example             # Sample Environment Variables
```

---

## **🚀 Deployment Plan** -- In Process
- **Frontend:** Vercel / Netlify
- **Backend:** Google Cloud Run / AWS / Render
- **Database:** MongoDB Atlas

---

## **📌 Future Enhancements**
✅ **Venue Ratings & Reviews** – Let users rate and review recommendations.  
✅ **Real-Time Location Filtering** – Suggest places based on user’s live location.  
✅ **Social Features** – Allow users to share recommendations with friends.  

---

## Authors
- ([Natnael Haile](https://github.com/natnaelhhaile))
- ([Siem Hagos](https://github.com/siezer-5997))

---

### **🌟 If you like this project, give it a ⭐ on GitHub! 🚀**
