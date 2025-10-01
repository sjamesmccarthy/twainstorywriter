import { getUserByEmail } from "../../src/lib/users";
import fs from "fs";
import path from "path";

const SIGNUP_REQUESTS_FILE = path.join(
  process.cwd(),
  "src/data/signup-requests.json"
);

// Helper functions for signup requests file
function readSignupRequests() {
  try {
    if (!fs.existsSync(SIGNUP_REQUESTS_FILE)) {
      return [];
    }
    const fileContent = fs.readFileSync(SIGNUP_REQUESTS_FILE, "utf8");
    const data = JSON.parse(fileContent);
    return data.requests || [];
  } catch (error) {
    console.error("Error reading signup requests file:", error);
    return [];
  }
}

function writeSignupRequests(requests) {
  try {
    const data = { requests };
    fs.writeFileSync(
      SIGNUP_REQUESTS_FILE,
      JSON.stringify(data, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Error writing signup requests file:", error);
    throw error;
  }
}

function generateRequestId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { name, email } = req.body;

  // Validate input
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  // Validate email format (must be Gmail)
  if (!email.toLowerCase().endsWith("@gmail.com")) {
    return res.status(400).json({ error: "Only Gmail addresses are accepted" });
  }

  try {
    // Check if user already exists in users.json
    const existingUser = getUserByEmail(email.toLowerCase());

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists",
      });
    }

    // Check if there's already a pending signup request
    const signupRequests = readSignupRequests();
    const existingSignup = signupRequests.find(
      (req) =>
        req.email.toLowerCase() === email.toLowerCase() &&
        req.status === "pending"
    );

    if (existingSignup) {
      return res.status(409).json({
        error: "A signup request with this email is already pending",
      });
    }

    // Create signup request
    const newRequest = {
      id: generateRequestId(),
      name: name.trim(),
      email: email.toLowerCase(),
      status: "pending",
      requested_at: new Date().toISOString(),
      processed_at: null,
      processed_by: null,
      notes: null,
    };

    signupRequests.push(newRequest);
    writeSignupRequests(signupRequests);

    return res.status(201).json({
      message: "Signup request submitted successfully",
      requestId: newRequest.id,
    });
  } catch (error) {
    console.error("Signup API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
