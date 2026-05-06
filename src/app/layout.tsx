import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { CLARITY_TRACKING_ID } from "@/constants/appConfig";

// @ts-ignore
import 'swiper/css';
// @ts-ignore
import 'swiper/css/navigation';
// @ts-ignore
import 'swiper/css/pagination';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WebSourcing Live",
  description: "Inteligencia de Adquisición para Machinery Hunters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}

        {/* ================= MICROSOFT CLARITY ================= */}
        <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_TRACKING_ID}");
          `}
        </Script>
        {/* ===================================================== */}

      </body>
    </html>
  );
}