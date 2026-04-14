import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Nova — AI Expense Tracker",
  description: "Your money. Understood. AI-powered personal finance tracker with smart insights.",
  keywords: ["expense tracker", "AI finance", "budget", "savings", "personal finance"],
  authors: [{ name: "Nova" }],
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Nova" },
  openGraph: {
    title: "Nova — AI Expense Tracker",
    description: "Your money. Understood.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0E1A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: "#0A0E1A" }}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1A1F3A",
              color: "#F8FAFC",
              border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: "12px",
              fontSize: "14px",
              maxWidth: "380px",
            },
            success: { iconTheme: { primary: "#10B981", secondary: "#F8FAFC" } },
            error: { iconTheme: { primary: "#FF6B6B", secondary: "#F8FAFC" } },
          }}
        />
      </body>
    </html>
  );
}
