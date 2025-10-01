import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { isUserAdmin } from "../../../src/lib/users";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: "Unauthorized", isAdmin: false });
    }

    const isAdmin = isUserAdmin(session.user.email);

    return res.status(200).json({ isAdmin });
  } catch (error) {
    console.error("Admin check API error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", isAdmin: false });
  }
}
