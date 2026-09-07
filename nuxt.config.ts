// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/ui"],
  css: ["~/assets/css/main.css"],
  fonts: {
    families: [
      {
        name: "Archivo Black",
        provider: "google",
        weights: [400],
      },
      {
        name: "Space Grotesk",
        provider: "google",
        weights: [400, 500, 700],
      },
    ],
  },
});
