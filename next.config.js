/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable strict mode to avoid double-renders in dev, just in case
    reactStrictMode: false,
    // Explicitly tell Next we are using the default output
    output: undefined,
};

module.exports = nextConfig;
