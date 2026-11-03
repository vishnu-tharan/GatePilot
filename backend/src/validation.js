// Simple validation helpers for request inputs

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

// Validates simple text fields
function text(body, key, required = false, max = 250) {
  const value = body?.[key];
  if (value == null && !required) return "";
  if (typeof value !== "string" || (required && !value.trim())) {
    fail(`Please enter a valid ${key}`);
  }
  return value.trim().slice(0, max);
}

// Validates that an input is from an allowed list of choices
function choice(body, key, allowedValues) {
  const value = text(body, key, true);
  if (!allowedValues.includes(value)) {
    fail(`Invalid selection for ${key}`);
  }
  return value;
}

// Standard password check (at least 6 characters)
function password(value) {
  if (typeof value !== "string" || value.length < 6) {
    fail("Password must be at least 6 characters long.");
  }
  return value;
}

function secret(body, key) {
  const value = body?.[key];
  if (typeof value !== "string" || !value) {
    fail(`Please provide ${key}`);
  }
  return value;
}

// Basic email format check
function email(body) {
  const value = text(body, "email", true, 254).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    fail("Please enter a valid email address.");
  }
  return value;
}

// Normalizes vehicle plate numbers (uppercase, removes excess whitespace)
function plate(body) {
  const raw = text(body, "vehicleNumber", true, 30);
  const cleaned = raw.toUpperCase().replace(/\s+/g, "");
  if (cleaned.length < 2) {
    fail("Please enter a valid vehicle number.");
  }
  return cleaned;
}

module.exports = {
  fail,
  text,
  choice,
  password,
  secret,
  email,
  plate,
};
