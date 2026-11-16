import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
        <footer className="w-full border-t border-gray-100 bg-white py-6 mt-auto">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-gray-400">
              © {new Date().getFullYear()} REZERVO — Gëzim Sejdiu
            </p>

            <div className="flex items-center gap-6 text-xs font-bold text-gray-500">
              <Link href="/terms" className="hover:text-gray-900 transition">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-gray-900 transition">
                Privacy Policy
              </Link>
            </div>

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
          </div>
        </footer>
      </body>
    </html>
  );
}