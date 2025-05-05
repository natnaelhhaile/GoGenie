import crypto from "crypto";

// Generate a unique share link based on venue ID and a random token
export function generateShareLink(venue_id) {
  const token = crypto.randomBytes(16).toString("hex");
  return `${process.env.FRONTEND_URL}/api/recommendations/details/${venue_id}?share=${token}`;
}