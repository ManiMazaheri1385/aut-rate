import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "استادسنجی امیرکبیر | سامانه ارزیابی اساتید",
    template: "%s | استادسنجی امیرکبیر",
  },
  description:
    "سامانه ارزیابی و نقد اساتید دانشکده ریاضیات و علوم کامپیوتر دانشگاه صنعتی امیرکبیر — نظرات واقعی دانشجویان از دروس و استادان.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Vazirmatn — Persian-friendly webfont (loaded app-wide via root layout) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
