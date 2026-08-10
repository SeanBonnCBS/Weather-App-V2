import type { Metadata } from "next";
import "./globals.css";
import "./layout-extra.css";

export const metadata: Metadata = {
  title: "Weatherly | Your daily weather",
  description: "A personal weather dashboard with live radar and official alerts."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
