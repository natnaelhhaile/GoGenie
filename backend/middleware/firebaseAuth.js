import admin from "../config/firebaseAdmin.js";

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // contains uid, email, etc.
    next();
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

const optionalVerifyFirebase = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken;
    } catch (error) {
      console.warn("Invalid Firebase token (continuing as guest):", error.message);
      req.user = null;
    }
  }
  next();
};

export { verifyFirebaseToken, optionalVerifyFirebase };