import fs from "fs";
import path from "path";

export default function handler(req, res) {
  // Path to feedback file
  const feedbackFilePath = path.join(
    process.cwd(),
    "src",
    "data",
    "feedback.json"
  );

  // Helper function to read feedback data
  const readFeedbackData = () => {
    let feedbackData = [];
    if (fs.existsSync(feedbackFilePath)) {
      try {
        const existingData = fs.readFileSync(feedbackFilePath, "utf8");
        feedbackData = JSON.parse(existingData);
      } catch (parseError) {
        console.error("Error parsing existing feedback file:", parseError);
        feedbackData = [];
      }
    }
    return feedbackData;
  };

  // Helper function to write feedback data
  const writeFeedbackData = (data) => {
    fs.writeFileSync(feedbackFilePath, JSON.stringify(data, null, 2));
  };

  // Handle GET request - Load feedback for admin
  if (req.method === "GET") {
    try {
      const feedbackData = readFeedbackData();
      res.status(200).json({ feedback: feedbackData });
    } catch (error) {
      console.error("Error loading feedback:", error);
      res.status(500).json({ message: "Internal server error" });
    }
    return;
  }

  // Handle PUT request - Update feedback status
  if (req.method === "PUT") {
    try {
      const { action, feedbackId } = req.body;

      if (
        !action ||
        !feedbackId ||
        (action !== "archive" && action !== "in-progress")
      ) {
        return res.status(400).json({ message: "Invalid request" });
      }

      const feedbackData = readFeedbackData();
      const feedbackIndex = feedbackData.findIndex(
        (item) => item.id === feedbackId
      );

      if (feedbackIndex === -1) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      // Update the feedback status
      if (action === "archive") {
        feedbackData[feedbackIndex].status = "archived";
        feedbackData[feedbackIndex].archivedAt = new Date().toISOString();
      } else if (action === "in-progress") {
        feedbackData[feedbackIndex].status = "in-progress";
        feedbackData[feedbackIndex].inProgressAt = new Date().toISOString();
      }

      writeFeedbackData(feedbackData);

      const message =
        action === "archive"
          ? "Feedback archived successfully"
          : "Feedback status updated to in-progress";
      res.status(200).json({ message });
    } catch (error) {
      console.error("Error updating feedback:", error);
      res.status(500).json({ message: "Internal server error" });
    }
    return;
  }

  // Handle DELETE request - Delete feedback
  if (req.method === "DELETE") {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Feedback ID is required" });
      }

      const feedbackData = readFeedbackData();
      const feedbackIndex = feedbackData.findIndex((item) => item.id === id);

      if (feedbackIndex === -1) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      // Remove the feedback item from the array
      feedbackData.splice(feedbackIndex, 1);

      writeFeedbackData(feedbackData);

      res.status(200).json({ message: "Feedback deleted successfully" });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      res.status(500).json({ message: "Internal server error" });
    }
    return;
  }

  // Handle POST request - Submit new feedback
  if (req.method === "POST") {
    try {
      const { type, area, subject, description, userEmail, userName } =
        req.body;

      // Validate required fields
      if (!type || !area || !subject || !description) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Create feedback entry
      const feedbackEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type,
        area,
        subject,
        description,
        userEmail: userEmail || "Anonymous",
        userName: userName || "Anonymous",
        status: "open",
      };

      const feedbackData = readFeedbackData();
      feedbackData.push(feedbackEntry);
      writeFeedbackData(feedbackData);

      res.status(200).json({
        message: "Feedback submitted successfully",
        id: feedbackEntry.id,
      });
    } catch (error) {
      console.error("Error processing feedback:", error);
      res.status(500).json({ message: "Internal server error" });
    }
    return;
  }

  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
}
