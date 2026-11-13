import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "REZERVO",
  description: "REZERVO",
  other: {
    "verify-paysera": "1a7f5641d20b6523d538b713a8b74524",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <footer className="w-full py-6 border-t border-gray-100 bg-white flex justify-center">
          <a
            href="https://agentaos.ai/?ref=badge&m=75bd6d7eee209cd9"
            data-agentaos-badge="75bd6d7eee209cd9"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://app.agentaos.ai/badge/secure-checkout-light.svg"
              alt="Secure checkout by AgentaOS"
              width={212}
              height={32}
              style={{ border: 0 }}
            />
          </a>
        </footer>
      </body>
    </html>
  );
}