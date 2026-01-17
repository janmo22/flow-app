import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ClientLayoutContent } from "@/components/ClientLayoutContent";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Flow OS",
  description: "Operating System for Creators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased min-h-screen bg-[var(--color-background)]`}>
        <AuthProvider>
          <ClientLayoutContent>{children}</ClientLayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
