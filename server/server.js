require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose")
const userRoutes = require('./routes/userRoutes');
const recommendationRoutes = require("./routes/recommendationRoutes");
const favoritesRoutes = require("./routes/favoritesRoutes");
const venueAssistantRouter = require("./routes/chat");
const feedbackRoutes = require("./routes/feedbackRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Enable CORS (Allow Frontend to Access Backend)
app.use(cors({ origin: "*" }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Atlas Connected!'))
.catch(err => console.log(err));

app.use('/api/users', userRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/chat", venueAssistantRouter);
app.use("/api/feedback", feedbackRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});