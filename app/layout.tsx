import "@/styles/globals.css";
import "@/styles/pretendard.css";
import { cookies } from "next/headers";
import { ThemeProvider } from "next-themes";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import localFont from "next/font/local";

const pretendard = localFont({
  src: "../assets/fonts/Pretendard/0.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme');

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${pretendard.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme={theme?.value || "dark"} enableSystem themes={["system", "light", "dark", "deepblue"]} disableTransitionOnChange={true} storageKey="theme">
          <NextIntlClientProvider locale={locale}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
