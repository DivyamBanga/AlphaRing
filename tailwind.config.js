/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#00D4FF",
          dark: "#00A3CC",
          light: "#33DDFF",
        },
        profit: "#22C55E",
        loss: "#EF4444",
        surface: {
          DEFAULT: "#0A0A0F",
          card: "#12121A",
          elevated: "#1A1A25",
          border: "#2A2A3A",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
