import pool from "../../src/lib/db";

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
    // Check if user already exists
    const [existingUser] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    if (Array.isArray(existingUser) && existingUser.length > 0) {
      return res.status(409).json({
        error: "An account with this email already exists",
      });
    }

    // Check if there's already a pending signup request
    const [existingSignup] = await pool.execute(
      "SELECT id FROM signup_requests WHERE email = ? AND status = 'pending'",
      [email.toLowerCase()]
    );

    if (Array.isArray(existingSignup) && existingSignup.length > 0) {
      return res.status(409).json({
        error: "A signup request with this email is already pending",
      });
    }

    // Create signup request
    const [result] = await pool.execute(
      "INSERT INTO signup_requests (name, email, status, requested_at) VALUES (?, ?, 'pending', NOW())",
      [name.trim(), email.toLowerCase()]
    );

    return res.status(201).json({
      message: "Signup request submitted successfully",
      requestId: result.insertId,
    });
  } catch (error) {
    console.error("Signup API error:", error);

    // Check if it's a database table error
    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        error:
          "Signup functionality is not yet available. Please contact the administrator.",
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}
