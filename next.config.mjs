/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'i.pravatar.cc',
            },
            {
                protocol: 'https',
                hostname: 'pub-0f9896b14f8c41848d2ef611dffb0b92.r2.dev',
            },
        ],
    },
    allowedDevOrigins: [
        'goedu.demo.vn',
        'teacher-goedu.demo.vn',
        'student-goedu.demo.vn',
    ],
};

export default nextConfig;
