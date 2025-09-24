import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineSupport";
import NotificationToastProvider from "@/components/NotificationToast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GoOut - U-M Social Events",
  description: "Connect with University of Michigan students and discover spontaneous events happening around campus.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <NotificationToastProvider>
              <OfflineIndicator />
              {children}
              <Toaster 
                position="top-right"
                expand={true}
                richColors={true}
                closeButton={true}
              />
            </NotificationToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
