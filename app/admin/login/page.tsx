"use client";

import { FormEvent, useState } from "react";
import { Alert, Button, Card, CardContent, Container, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      setError("Invalid password.");
      setLoading(false);
      return;
    }

    router.push("/admin");
  }

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 5 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>Researcher Back Office</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Sign in to review submitted recordings.
          </Typography>
          <form onSubmit={login}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Admin password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={loading || !password}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}