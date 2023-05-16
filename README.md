Demo: https://youtu.be/YkOSUVzOAA4

Hey! This is a Demo Project modeled after the functionality of Twitter. The purpose of this project is to build a production-ready application with the T3 Stack: A Next.JS based framework that uses Typescript, TailwindCSS, TRPC and Prisma.

In this project, we enbaled Upstash (built on Redis) rate limiting to prevent DDOS attacks and post spamming,

We used Clerk for Authentication, and ensured back-to front typesafety with Zod. Data management was each passed through a GraphQL API, and we used Prisma and PrismaStudio to manage our Planetscale Database, built on MySQL.

Post-Demo - Actions to do: 
- deploy final to vercel
- Provide forward, back, pagination/ infinite scroll.
- Add a way to upload background cover images
- Convert state managed post-wizard to react-hook-form
- Update UI for mobile responsiveness
- Edit posts and perform content refresh.
- include a messenger-style chat from user to user