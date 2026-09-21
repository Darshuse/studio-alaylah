/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || "http://localhost:8080";
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // حزمة مكتفية ذاتيًا للنشر (Docker/Railway)
  async rewrites() {
    // توجيه نداءات الـAPI للباك إند (بيئي: يُضبط API_URL في الإنتاج)
    return [{ source: "/api/:path*", destination: API_URL + "/api/:path*" }];
  },
};
export default nextConfig;
