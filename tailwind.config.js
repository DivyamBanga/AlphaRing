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
          DEFAULT: "#C5FF00",
          dark: "#A3D400",
          light: "#D4FF33",
        },
        profit: "#00E57A",
        loss: "#FF3D3D",
        surface: {
          DEFAULT: "#080808",
          card: "#0D0D0D",
          elevated: "#131313",
          border: "#222222",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-mono)", "monospace"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
