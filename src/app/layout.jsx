import { Josefin_Sans, Playfair_Display } from 'next/font/google'

const josefin_sans = Josefin_Sans({
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-josefin_sans',
  display: 'swap',
  adjustFontFallback: false,
})

const playfair_display = Playfair_Display({
  weight: ['400', '500', '600', '700', '800', '900', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-playfair_display',
  display: 'swap',
  adjustFontFallback: false,
})

import "./globals.css";

import "@styles/css/plugins/bootstrap.min.css";
import "@styles/css/plugins/swiper.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { register } from "swiper/element/bundle";
// register Swiper custom elements
register();

import '@styles/scss/style.scss';

import AppData from "@data/app.json";
import FloatingCallButtonHost from "@components/FloatingCallButtonHost";

const siteUrl = process.env.SITE_URL?.trim() || "https://latablemarine.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
		default: AppData.settings.siteName,
		template: "%s | " + AppData.settings.siteName,
	},
  description: AppData.settings.siteDescription,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: AppData.settings.siteName,
    title: AppData.settings.siteName,
    description: AppData.settings.siteDescription,
    images: [
      {
        url: "/img/image00015.png",
        width: 1200,
        height: 630,
        alt: "Restaurant La Table Marine à Plaisir",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: AppData.settings.siteName,
    description: AppData.settings.siteDescription,
    images: ["/img/image00015.png"],
  },
}

const Layouts = ({
  children
}) => {
  return (
    <html lang="fr" className={`${josefin_sans.variable} ${playfair_display.variable}`}>
      <body style={{"backgroundImage": "url("+AppData.settings.bgImage+")"}}>
        <div className="tst-main-overlay"></div>
        <FloatingCallButtonHost />
        
        {/* app wrapper */}
        <div id="tst-app" className="tst-app">
          {children}
        </div>
        {/* app wrapper end */}
      </body>
    </html>
  );
};
export default Layouts;
