/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#E89F88", // Pastel Peach (Instax-like)
                "primary-dark": "#D68C76",
                "pastel-bg": "#FDF6F0", // Light cream (Paper-like)
                "dark-bg": "#1A1A1A",
                "dark-surface": "#2A2A2A",
                // Pastels
                "pastel-pink": "#F4C2C2",
                "pastel-blue": "#AEC6CF",
                "pastel-green": "#77DD77",
                "pastel-purple": "#B39EB5",
                "pastel-yellow": "#FDFD96",
                // Polaroid Spectrum
                "polaroid-red": "#FF385C",
                "polaroid-orange": "#FFB52E",
                "polaroid-yellow": "#FFEB3B",
                "polaroid-green": "#00C853",
                "polaroid-blue": "#2979FF",
            },
            backgroundImage: {
                'polaroid-spectrum': 'linear-gradient(to right, #FF385C, #FFB52E, #FFEB3B, #00C853, #2979FF)',
            },
            borderRadius: {
                xl: "1rem",
                "2xl": "1.5rem",
            },
        },
    },
    plugins: [],
}
