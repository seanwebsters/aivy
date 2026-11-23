import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Aivy — Meet your new AI expert", template: "%s · Aivy" },
  description: "Enter your business website. Discover what AI could do for you in 60 seconds — then get a complete, personalised plan to make it happen.",
  openGraph: {
    title: "Aivy — Meet your new AI expert",
    description: "Discover exactly how AI could save your business time, reduce costs and unlock new opportunities.",
    images: ["/aivy/hero-bg.webp"],
  },
};

export const viewport: Viewport = { themeColor: "#150d33" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={jakarta.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
