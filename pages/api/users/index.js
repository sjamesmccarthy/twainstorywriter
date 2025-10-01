import pool from "../../../src/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

async function checkUserAuth(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  const [adminCheck] = await pool.execute(
    'SELECT id FROM users WHERE email = ? AND oauth = "GOOGLE"',
    [session.user.email]
  );

  if (!Array.isArray(adminCheck) || adminCheck.length === 0) {
    return { error: "Access denied", status: 403 };
  }

  return { user: session.user };
}

export default async function handler(req, res) {
  try {
    const authResult = await checkUserAuth(req, res);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    switch (req.method) {
      case "GET": {
        const [users] = await pool.execute(
          "SELECT id, email, name, oauth, created FROM users ORDER BY created"
        );
        return res.status(200).json({ users });
      }

      case "POST": {
        const { email, name, oauth = "GOOGLE" } = req.body;

        if (!email || !name) {
          return res.status(400).json({ error: "Email and name are required" });
        }

        try {
          const [result] = await pool.execute(
            "INSERT INTO users (email, name, oauth) VALUES (?, ?, ?)",
            [email, name, oauth]
          );
          return res.status(201).json({
            message: "User added successfully",
            userId: result.insertId,
          });
        } catch (error) {
          if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "User already exists" });
          }
          throw error;
        }
      }

      case "DELETE": {
        const { email: emailToDelete } = req.body;

        if (!emailToDelete) {
          return res.status(400).json({ error: "Email is required" });
        }

        if (emailToDelete === authResult.user.email) {
          return res
            .status(400)
            .json({ error: "Cannot delete your own account" });
        }

        const [deleteResult] = await pool.execute(
          "DELETE FROM users WHERE email = ?",
          [emailToDelete]
        );

        if (deleteResult.affectedRows > 0) {
          return res.status(200).json({ message: "User removed successfully" });
        } else {
          return res.status(404).json({ error: "User not found" });
        }
      }

      default:
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        return res
          .status(405)
          .json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
