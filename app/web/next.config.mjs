/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // توجيه نداءات الـAPI للباك إند أثناء التطوير
    return [{ source: "/api/:path*", destination: "http://localhost:8080/api/:path*" }];
  },
};
export default nextConfig;
