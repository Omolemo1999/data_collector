import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";

export const metadata: Metadata = {
  title: "Voice Data Collection",
  description: "Temporary volunteer voice-data collection platform"
};

const theme = createTheme({
  palette: {
    primary: { main: "#315CD6" },
    secondary: { main: "#19347F" },
    background: { default: "#F7F9FC" }
  },
  typography: {
    fontFamily: "Arial, sans-serif"
  }
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}