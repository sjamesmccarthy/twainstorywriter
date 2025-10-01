import { useRouter } from "next/router";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";

export default function AccessDeniedPage() {
  const router = useRouter();

  const handleBackToSignIn = () => {
    router.push("/auth/signin");
  };

  const handleRequestAccess = () => {
    router.push("/auth/signup");
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={4}>
          <BlockIcon sx={{ fontSize: 60, color: "error.main", mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You don&apos;t have permission to access this application.
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 3 }}>
          Your email address is not authorized to use this application. Please
          request access or contact an administrator.
        </Alert>

        <Box display="flex" flexDirection="column" gap={2}>
          <Button variant="contained" onClick={handleRequestAccess} fullWidth>
            Request Access
          </Button>

          <Button variant="outlined" onClick={handleBackToSignIn} fullWidth>
            Back to Sign In
          </Button>
        </Box>

        <Box mt={4} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            If you believe this is an error, please contact the application
            administrator.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
