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
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
    allowedDevOrigins: [
        'myapp.test',
        'teacher.myapp.test',
        'student.myapp.test',
    ],
};

export default nextConfig;
