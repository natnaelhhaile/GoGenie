const express = require("express");
const verifyToken = require("../middleware/firebaseAuth");

const router = express.Router();

router.get("/dashboard", verifyToken, (req, res) => {
  res.json({
    message: "Welcome to the dashboard!",
    user: req.user,
  });
});

module.exports = router;
