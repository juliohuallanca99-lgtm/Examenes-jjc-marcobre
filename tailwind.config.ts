import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta corporativa JJC, tomada del logotipo oficial:
        // navy #202140 y verde #00A080.
        navy: {
          950: "#15162B",
          900: "#1A1B36",
          800: "#202140", // color de marca
          700: "#2B2C55",
          600: "#3A3B6E",
          100: "#D5D6E4", // texto claro sobre fondo navy
        },

        // Verde corporativo. Se usa para acciones y estados positivos.
        verde: {
          600: "#007F66", // sobre blanco: contraste 4.8:1, apto para texto
          500: "#00A080", // color de marca
          100: "#D9F2EC",
        },

        // "gold" era el dorado anterior. Ahora apunta al verde corporativo
        // para que las 16 pantallas que ya lo usan cambien solas, sin tocarlas.
        // Queda pendiente renombrarlo a "verde" en una limpieza posterior.
        gold: {
          600: "#007F66",
          500: "#00A080",
          100: "#D9F2EC",
        },

        // Ambar real, para advertencias. Antes se usaba el dorado de marca
        // para esto, lo que confundia "corporativo" con "atencion".
        ambar: {
          600: "#8A5300",
          500: "#B06A00",
          100: "#FFF6E6",
        },

        ink: "#16181F",
        paper: "#F6F8FA",
        line: "#E2E6EC",
      },

      // Escala tipografica. La anterior era la de Tailwind (xs = 12px,
      // sm = 14px), demasiado chica para leer en tablet a pleno sol.
      // Subir el piso aqui agranda todo el sistema de una sola vez.
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.15rem" }], // 13px, antes 12
        sm: ["0.9375rem", { lineHeight: "1.4rem" }], //  15px, antes 14
        base: ["1rem", { lineHeight: "1.55rem" }], //    16px
        lg: ["1.125rem", { lineHeight: "1.65rem" }], //  18px
        xl: ["1.3125rem", { lineHeight: "1.8rem" }], //  21px, antes 20
        "2xl": ["1.625rem", { lineHeight: "2.1rem" }], // 26px, antes 24
        "3xl": ["2rem", { lineHeight: "2.4rem" }], //    32px
      },

      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
