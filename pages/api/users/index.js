import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import {
  getAllUsers,
  getUserByEmail,
  addUserToAllowedList,
  removeUserFromAllowedList,
} from "../../../src/lib/users";

async function checkUserAuth(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = getUserByEmail(session.user.email);

  if (!user || user.status !== "active") {
    return { error: "Access denied", status: 403 };
  }

  return { user: session.user, userData: user };
}

export default async function handler(req, res) {
  try {
    const authResult = await checkUserAuth(req, res);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    switch (req.method) {
      case "GET": {
        const users = getAllUsers();
        return res.status(200).json({ users });
      }

      case "POST": {
        const { email, name, isAdmin = false } = req.body;

        if (!email || !name) {
          return res.status(400).json({ error: "Email and name are required" });
        }

        try {
          const newUser = addUserToAllowedList({ email, name, isAdmin });
          return res.status(201).json({
            message: "User added successfully",
            user: newUser,
          });
        } catch (error) {
          if (error.message === "User already exists") {
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

        const success = removeUserFromAllowedList(emailToDelete);

        if (success) {
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
