import { Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

export default function Home() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", py: 6 }}>
      <Container maxWidth="md">
        <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
          <CardContent sx={{ p: { xs: 3, md: 6 } }}>
            <Typography variant="overline" color="primary" fontWeight={700}>
              VOLUNTEER VOICE DATA COLLECTION
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ mt: 1, mb: 2 }}>
              Help build a voice dataset
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
              You will be asked to record short, safe voice clips for research.
              Participation is voluntary. Please do not record anything that reveals
              private information.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button component={Link} href="/consent" variant="contained" size="large">
                Start
              </Button>
              <Button component={Link} href="/admin/login" variant="outlined" size="large">
                Researcher Back Office
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}