/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        staleTimes: {
            dynamic: 60,   // cache dynamic pages for 60s in the router cache
            static: 300,   // cache static pages for 5 min
        }
    }
}
module.exports = nextConfig