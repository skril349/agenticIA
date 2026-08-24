import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // Esto genera archivos estáticos
  images: {
    unoptimized: true  // Requerido para export estático
  }
};

export default nextConfig;