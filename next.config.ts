import type { NextConfig } from "next";

/**
 * The redesign collapsed nine destinations into five: the budget and the
 * monthly summary became Mi mes, and the converter and rate history became
 * Convertir. These redirects keep links anyone has already saved or shared
 * working, rather than answering them with a 404.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      { source: "/presupuesto", destination: "/mi-mes", permanent: true },
      { source: "/resumen", destination: "/mi-mes", permanent: true },
      { source: "/simulador", destination: "/convertir", permanent: true },
      { source: "/historial", destination: "/convertir", permanent: true },
    ];
  },
};

export default nextConfig;
