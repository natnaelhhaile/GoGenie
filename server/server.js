require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose")
const protectedRoutes = require("./routes/protectedRoutes");
const userRoutes = require('./routes/userRoutes');
// const preferenceRoutes = require('./routes/preferenceRoutes');

const app = express();
app.use(cors());
app.use(express.json());


// ✅ Enable CORS (Allow Frontend to Access Backend)
app.use(cors({ origin: "*" }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

app.use("/api/routes", protectedRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/preferences', preferenceRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});