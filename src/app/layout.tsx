import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Movie Belli - Track, Share, and Discover Movies",
  description: "Track your watchlist, share reviews with friends, and discover your next favorite movie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSans.variable} ${instrumentSerif.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
