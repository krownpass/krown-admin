import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

// ✅ Use Google version instead of local .ttf
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Krown",
  description: "Your passport to the best cafés",
  icons: {
    icon: "/krown.png",
    shortcut: "/krown.png",
    apple: "/krown.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Geist Mono = Global (Body) Font */}
      <body className={geistMono.variable}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

