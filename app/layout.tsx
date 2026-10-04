import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CookieNotice from "./cookie-notice";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FastVPN — your account, under your control",
  description: "Manage your FastVPN account, subscription, devices, and payments in one simple dashboard.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}><body className="min-h-full">{children}<CookieNotice /></body></html>;
}
