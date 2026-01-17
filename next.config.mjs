/** @type {import('next').NextConfig} */
const nextConfig = {
    // Force standalone output for better Vercel handling
    output: "standalone",
    // Ensure we are not strictly strict if that was the issue (optional)
    reactStrictMode: true,
};

export default nextConfig;
