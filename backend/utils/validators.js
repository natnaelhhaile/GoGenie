// Check if a name (fname, lname) is valid: only letters, hyphens, apostrophes, and spaces
export const isValidName = (str) =>
    typeof str === "string" && /^[a-zA-Z-' ]{1,50}$/.test(str.trim());

// Age: integer between 1 and 120
export const isValidAge = (n) =>
    Number.isInteger(n) && n > 0 && n <= 120;

// Venue ID: alphanumeric with optional dashes/underscores, 5–100 characters
export const isValidVenueId = (id) =>
    typeof id === "string" && /^[a-zA-Z0-9_-]{5,100}$/.test(id);

// Search query: 2–100 chars, non-empty after trim
export const isValidSearchQuery = (query) =>
    typeof query === "string" && query.trim().length >= 2 && query.trim().length <= 100;

// City/state/industry: letters, spaces, basic punctuation (e.g., "San José", "Tech/IT")
export const isValidTextField = (text) =>
    typeof text === "string" && /^[\p{L}\p{N}\/&(),.?'!:\-\s]{2,100}$/u.test(text.trim());

// Address: letters, numbers, punctuation and spaces (e.g., "123 Main St, Apt 4B")
export const isValidAddress = (text) =>
    typeof text === "string" &&
    text.trim().length >= 5 &&
    text.trim().length <= 100 &&
    /^[a-zA-Z0-9\s.,#\-\\/']+$/.test(text.trim());

// Feedback type: must be "up", "down", or "none"
export const isValidFeedbackType = (val) =>
    typeof val === "string" && ["up", "down", "none"].includes(val);

// Validate arrays of strings
export const isValidStringArray = (arr) => 
    Array.isArray(arr) && arr.every(item => typeof item === "string");

// Function to escape/sanitize textual input that needs to be regex'd
export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}