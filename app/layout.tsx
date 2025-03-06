import RouterTransition from "@/components/ui/routerTransition";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Image from "next/image";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elevate Global App",
  description: "Elevate Global App",
};

const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={roboto.className}>
      <body className="h-screen overflow-x-hidden">
        <main className="relative min-h-screen">
          <RouterTransition />
          <div className="absolute inset-0 -z-10 h-full w-full">
            {/* Background Image */}
            <Image
              src="/assets/bg-primary.png"
              alt="Background"
              quality={80}
              fill
              priority
              className="object-cover"
            />
          </div>
          <Suspense fallback={<RouterTransition />}>{children}</Suspense>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
