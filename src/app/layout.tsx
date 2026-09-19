import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { Footer } from "@/components/footer";
import { AuroraBackground } from "@/components/aurora-background";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rift Report",
  description: "Search a League of Legends Riot ID and see the last 10 games, with commentary.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-zinc-50">
        <AuroraBackground />
        <QueryProvider>
          {children}
          <Footer />
        </QueryProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "rounded-2xl! border! border-white/10! bg-zinc-900/80! backdrop-blur-xl! shadow-2xl! shadow-black/40!",
              title: "text-zinc-100!",
              description: "text-zinc-400!",
            },
          }}
        />
      </body>
    </html>
  );
}
