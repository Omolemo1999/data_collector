import type { Metadata } from "next";
import ThemeRegistry from "./ThemeRegistry";

export const metadata: Metadata = {
  title: "Voice Data Collection",
  description: "Temporary volunteer voice-data collection platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
