/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "geist-sans": ["var(--font-geist-sans)"],
        "geist-mono": ["var(--font-geist-mono)"],
        "ibm-plex-sans": ["var(--font-ibm-plex-sans)"],
        spectral: ["var(--font-spectral)"],
        "jetbrains-mono": ["var(--font-jetbrains-mono)"],
        rubik: ["var(--font-rubik)"],
        alike: ["var(--font-alike)"],
        "crimson-text": ["var(--font-crimson-text)"],
      },
    },
  },
  plugins: [],
};
