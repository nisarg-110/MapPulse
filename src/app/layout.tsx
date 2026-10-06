import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MapPulse — Player Journey Visualization",
  description: "Replay and analyze player journeys across battle-royale matches.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-lila-bg text-white h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
