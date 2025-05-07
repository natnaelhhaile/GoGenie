import crypto from "crypto";

export function generateShareToken() {
    return crypto.randomBytes(16).toString("hex");
}

export function generateShareLink(venue_id, token) {
    return `${process.env.FRONTEND_URL}/venue/${venue_id}?share=${token}`;
}  