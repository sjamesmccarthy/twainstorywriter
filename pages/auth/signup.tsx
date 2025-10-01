import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Divider,
} from "@mui/material";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Get email from query params if available
    if (router.query.email) {
      setEmail(router.query.email as string);
    }
  }, [router.query.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Your signup request has been submitted successfully! You will be notified when your account is approved."
        );
        setName("");
        setEmail("");
      } else {
        setError(
          data.error || "An error occurred while submitting your request"
        );
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("An error occurred while submitting your request");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    signIn("google");
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Request Access
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your email is not authorized to access this application. Please
            request access below.
          </Typography>
        </Box>

        {message && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            margin="normal"
            disabled={!!router.query.email}
            helperText={
              router.query.email
                ? "This email was detected from your Google sign-in attempt"
                : "Please enter your Gmail address"
            }
          />

          <TextField
            fullWidth
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            margin="normal"
            helperText="Please enter your full name as you'd like it to appear in the application"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? "Submitting Request..." : "Request Access"}
          </Button>
        </form>

        <Divider sx={{ my: 3 }} />

        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Already have access?
          </Typography>
          <Button variant="outlined" onClick={handleBackToSignIn} fullWidth>
            Back to Sign In
          </Button>
        </Box>

        <Box mt={4} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Note: Only Gmail addresses are accepted. You will receive an email
            notification when your request is processed.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
