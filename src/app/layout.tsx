import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { faIR } from "@clerk/localizations";
import { isClerkConfigured } from "@/lib/clerk-config";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "استادسنجی امیرکبیر | سامانه ارزیابی اساتید",
    template: "%s | استادسنجی امیرکبیر",
  },
  description:
    "سامانه ارزیابی و نقد اساتید دانشکده ریاضیات و علوم کامپیوتر دانشگاه صنعتی امیرکبیر، نظرات واقعی دانشجویان از دروس و استادان.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Vazirmatn — body/UI text. Markazi Text — scholarly Persian display face for headings. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&family=Markazi+Text:wght@400;500;600;700&display=swap"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--font-display:"Markazi Text","Vazirmatn",serif}`,
          }}
        />
      </head>
      <body className="min-h-screen">
        {isClerkConfigured ? (
          <ClerkProvider localization={faIR}>
            <Providers>{children}</Providers>
          </ClerkProvider>
        ) : (
          <Providers>{children}</Providers>
        )}
      </body>
    </html>
  );
}
