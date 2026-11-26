import localFont from "next/font/local";

// Font files are in the repo (latin subset from Google Fonts). next/font/google
// fetches at build time, and that fetch fails on the Firebase App Hosting builder.
export const poppins = localFont({
  src: [
    { path: "./fonts/poppins-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
});
export const inter = localFont({
  src: "./fonts/inter-variable.woff2",
  weight: "400 600",
  variable: "--font-inter",
});
