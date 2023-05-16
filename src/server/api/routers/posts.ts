import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "../../helpers/filterUserForClient";
import { z } from "zod";
import type { Post } from "@prisma/client";

import {
    createTRPCRouter,
    publicProcedure,
    privateProceedure,
} from "~/server/api/trpc";

const addUsersDataToPosts = async (posts: Post[]) => {
    const userId = posts.map((post) => post.authorId);
    const users = (
        await clerkClient.users.getUserList({
            userId: userId,
            limit: 100,
        })
    ).map(filterUserForClient);

    return posts.map((post) => {
        const author = users.find((user) => user.id === post.authorId);

        if (!author || !author.username)
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Author for post not found. POST ID: ${post.id}, USER ID: ${post.authorId}`,
            });

        // if (!author.username) {
        //     // user the ExternalUsername
        //     if (!author.externalUsername) {
        //         throw new TRPCError({
        //             code: "INTERNAL_SERVER_ERROR",
        //             message: `Author has no GitHub Account: ${author.id}`,
        //         });
        //     }
        //     author.username = author.externalUsername;
        // }

        return {
            post,
            author: {
                ...author,
                username: author.username,
            },
        };
    });
};

// upstash 3 requests per 1 minute
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit",
});

export const postsRouter = createTRPCRouter({
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const post = await ctx.prisma.post.findUnique({
                where: {
                    id: input.id,
                },
            });
            if (!post) throw new TRPCError({ code: "NOT_FOUND" });

            return (await addUsersDataToPosts([post]))[0];
        }),
    getAll: publicProcedure.query(async ({ ctx }) => {
        const posts = await ctx.prisma.post.findMany({
            take: 100,
            orderBy: [{ createdAt: "desc" }],
        });
        // const users = (
        //     await clerkClient.users.getUserList({
        //         userId: posts.map((post) => post.authorId),
        //         limit: 100,
        //     })
        // ).map(filterUserForClient);

        // console.log(users);

        // return posts.map((post) => {
        //     const author = users.find((user) => user.id === post.authorId);

        //     if (!author || !author.username)
        //         throw new TRPCError({
        //             code: "INTERNAL_SERVER_ERROR",
        //             message: "Author for post not found",
        //         });

        //     return {
        //         post,
        //         author: {
        //             ...author,
        //             username: author.username,
        //         },
        //     };
        // });
        return await addUsersDataToPosts(posts);
    }),

    getPostsByUserId: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(({ ctx, input }) =>
            ctx.prisma.post
                .findMany({
                    where: {
                        authorId: input.userId,
                    },
                    take: 100,
                    orderBy: [{ createdAt: "desc" }],
                })
                .then(addUsersDataToPosts)
        ),

    // API ENDPOINT
    create: privateProceedure
        .input(
            z.object({
                content: z.string().min(1).max(280),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const authorId = ctx.userId;

            const { success } = await ratelimit.limit(authorId);
            if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

            const post = await ctx.prisma.post.create({
                data: {
                    authorId,
                    content: input.content,
                },
            });
            return post;
        }),
});
