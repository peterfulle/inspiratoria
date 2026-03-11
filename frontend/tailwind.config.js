/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FFFEF0",
          100: "#FFFBD6",
          200: "#FFF7AD",
          300: "#FFF384",
          400: "#FFEF5B",
          500: "#FFD902",
          600: "#E6C300",
          700: "#CCAD00",
          800: "#B39700",
          900: "#998100"
        },
        dark: {
          50: "#525252",
          100: "#404040",
          200: "#303030",
          300: "#262626",
          400: "#1a1a1a",
          500: "#0a0a0a",
          600: "#000000",
          700: "#000000",
          800: "#000000",
          900: "#000000"
        },
      },
      boxShadow: {
        card: "0 20px 45px -20px rgba(255, 217, 2, 0.25)",
        glow: "0 0 20px rgba(255, 217, 2, 0.3)",
      },
    },
  },
  plugins: [],
};
