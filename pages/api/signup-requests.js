import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { getUserByEmail, addUserToAllowedList } from "../../src/lib/users";
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

async function checkAdminAuth(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = getUserByEmail(session.user.email);

  if (!user || user.status !== "active") {
    return { error: "Access denied", status: 403 };
  }

  // Check if user has admin privileges
  if (!user.is_admin) {
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
        const requests = readSignupRequests();
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
        const requests = readSignupRequests();
        const signupRequest = requests.find(
          (req) => req.id === requestId && req.status === "pending"
        );

        if (!signupRequest) {
          return res
            .status(404)
            .json({ error: "Signup request not found or already processed" });
        }

        if (action === "approve") {
          // Add user to users.json
          try {
            addUserToAllowedList({
              email: signupRequest.email,
              name: signupRequest.name,
              isAdmin: false,
            });
          } catch (error) {
            if (error.message === "User already exists") {
              return res.status(409).json({ error: "User already exists" });
            }
            throw error;
          }
        }

        // Update signup request status
        const updatedRequests = requests.map((req) => {
          if (req.id === requestId) {
            return {
              ...req,
              status: action === "approve" ? "approved" : "rejected",
              processed_at: new Date().toISOString(),
              processed_by: authResult.user.email,
              notes: notes || null,
            };
          }
          return req;
        });

        writeSignupRequests(updatedRequests);

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
