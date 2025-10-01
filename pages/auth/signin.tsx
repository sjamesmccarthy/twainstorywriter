import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push("/");
      }
    });

    // Check for error in query params
    if (router.query.error) {
      setError("Sign in failed. Please try again.");
    }
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await signIn("google", {
        callbackUrl: "/",
        redirect: false,
      });

      if (result?.error) {
        setError("Sign in failed. Please try again.");
      } else if (result?.url) {
        // Handle redirect manually to catch signup redirects
        if (result.url.includes("/auth/signup")) {
          router.push(result.url);
        } else {
          router.push(result.url || "/");
        }
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Sign In
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome to Twain Story Writer
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box textAlign="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: "1.1rem",
              backgroundColor: "#4285f4",
              "&:hover": {
                backgroundColor: "#357ae8",
              },
            }}
          >
            {loading ? "Signing in..." : "Sign in with Google"}
          </Button>
        </Box>

        <Box mt={4} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Don&apos;t have access? You&apos;ll be redirected to request access
            if your email isn&apos;t authorized.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
