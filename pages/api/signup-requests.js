import pool from "../../src/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

async function checkAdminAuth(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  // Check if user is admin (checking if they're in the users table AND is_admin = 1)
  const [adminCheck] = await pool.execute(
    'SELECT id, is_admin FROM users WHERE email = ? AND oauth = "GOOGLE"',
    [session.user.email]
  );

  if (!Array.isArray(adminCheck) || adminCheck.length === 0) {
    return { error: "Access denied", status: 403 };
  }

  // Check if user has admin privileges
  if (adminCheck[0].is_admin !== 1) {
    return { error: "Admin access required", status: 403 };
  }

  return { user: session.user };
}

export default async function handler(req, res) {
  try {
    const authResult = await checkAdminAuth(req, res);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    switch (req.method) {
      case "GET": {
        const [requests] = await pool.execute(
          "SELECT id, name, email, status, requested_at, processed_at, processed_by, notes FROM signup_requests ORDER BY requested_at DESC"
        );
        return res.status(200).json({ requests });
      }

      case "POST": {
        const { action, requestId, notes } = req.body;

        if (!action || !requestId) {
          return res
            .status(400)
            .json({ error: "Action and requestId are required" });
        }

        if (!["approve", "reject"].includes(action)) {
          return res.status(400).json({ error: "Invalid action" });
        }

        // Get the signup request
        const [requests] = await pool.execute(
          "SELECT * FROM signup_requests WHERE id = ? AND status = 'pending'",
          [requestId]
        );

        if (!Array.isArray(requests) || requests.length === 0) {
          return res
            .status(404)
            .json({ error: "Signup request not found or already processed" });
        }

        const signupRequest = requests[0];

        if (action === "approve") {
          // Add user to users table
          try {
            await pool.execute(
              "INSERT INTO users (email, name, oauth) VALUES (?, ?, 'GOOGLE')",
              [signupRequest.email, signupRequest.name]
            );
          } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
              return res.status(409).json({ error: "User already exists" });
            }
            throw error;
          }
        }

        // Update signup request status
        await pool.execute(
          "UPDATE signup_requests SET status = ?, processed_at = NOW(), processed_by = ?, notes = ? WHERE id = ?",
          [
            action === "approve" ? "approved" : "rejected",
            authResult.user.email,
            notes || null,
            requestId,
          ]
        );

        return res.status(200).json({
          message: `Signup request ${action}d successfully`,
        });
      }

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res
          .status(405)
          .json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error("Signup requests API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
