"use client";

import { useState } from "react";
import { Box, Button, Card, CardContent, Checkbox, Container, FormControlLabel, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export default function ConsentPage() {
  const [accepted, setAccepted] = useState(false);
  const router = useRouter();

  function continueToRecording() {
    if (!accepted) return;
    const participantId = `P-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    sessionStorage.setItem("participantId", participantId);
    sessionStorage.setItem("consentAt", new Date().toISOString());
    router.push("/record");
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>Consent</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
            Participation is voluntary. You may stop at any time. The system records
            the audio clips you submit and a random participant code. Please avoid
            saying your name, address, phone number, passwords, or other private
            information in recordings.
          </Typography>

          <Box sx={{ mt: 3, p: 2, bgcolor: "grey.100", borderRadius: 2 }}>
            <Typography fontWeight={700} gutterBottom>Recording safety</Typography>
            <Typography variant="body2" color="text.secondary">
              The fear and scream prompts are acted voice exercises. Do not put
              yourself in danger or perform anything physically unsafe.
            </Typography>
          </Box>

          <FormControlLabel
            sx={{ mt: 3, alignItems: "flex-start" }}
            control={<Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />}
            label="I understand the information above and voluntarily agree to participate."
          />

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="contained" disabled={!accepted} onClick={continueToRecording}>
              Continue
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}