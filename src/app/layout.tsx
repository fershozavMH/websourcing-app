import type { Metadata } from "next";
import "./globals.css";
// @ts-ignore
import 'swiper/css';
// @ts-ignore
import 'swiper/css/navigation';
// @ts-ignore
import 'swiper/css/pagination';

export const metadata: Metadata = {
  title: "WebSourcing - Machinery Hunters",
  description: "Inteligencia de Adquisición para Machinery Hunters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
