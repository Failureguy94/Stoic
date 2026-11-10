import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const display = Fredoka({ variable: "--font-display-face", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Nunito({ variable: "--font-body", subsets: ["latin"], weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: `${SITE_NAME}: ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 focus:outline-none sm:px-6 has-[[data-wide]]:max-w-[90rem]"
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
