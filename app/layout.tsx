import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// Atkinson Hyperlegible was designed by the Braille Institute for low-vision readers.
const bodyFont = Atkinson_Hyperlegible({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME}: ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodyFont.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 has-[[data-wide]]:max-w-[88rem] px-4 py-8 focus:outline-none sm:px-6 sm:py-12">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
