/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Аватары/портфолио из Supabase Storage (когда бакет станет публичным).
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
};

export default nextConfig;
