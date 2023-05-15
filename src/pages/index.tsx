import { SignIn, SignInButton, useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import React, { useState, useEffect, useContext } from "react";
import { type NextPage } from "next";
import { toast } from "react-hot-toast";
import Head from "next/head";
import Link from "next/link";

import { api } from "~/utils/api";
import { RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import LoadingPage, { Spinner } from "../components/spinner";

const CreatePostWizard = () => {
    const { user } = useUser();
    const [input, setInput] = useState("");
    const ctx = api.useContext();

    const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
        onSuccess: () => {
            setInput("");
            void ctx.posts.getAll.invalidate();
        },
        onError: (e) => {
            const errorMessage = e.data?.zodError?.fieldErrors.content;
            if (errorMessage && errorMessage[0]) {
                toast.error(errorMessage[0]);
            } else {
                toast.error("Failed to post! Please try again later.");
            }
        },
    });

    //user Info
    if (!user) return null;

    return (
        <div className="flex w-full justify-center gap-2 dark:placeholder:text-white">
            <Image
                src={user.profileImageUrl}
                alt={` ${user.username} profile picture `}
                className="flex rounded-full"
                width={56}
                height={56}
            />
            <input
                placeholder="Type some stuff"
                className="grow bg-transparent px-4 outline-none focus:placeholder:opacity-5"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        if (input !== "") {
                            mutate({ content: input });
                        }
                    }
                }}
                type="text"
                value={input}
            />
            {input !== "" && !isPosting && (
                <button
                    className="my-auto mt-4 h-fit rounded-lg bg-zinc-800 px-4 py-2 text-white"
                    onClick={() => {
                        mutate({ content: input });
                    }}
                >
                    Post
                </button>
            )}
            {isPosting && (
                <div className="flex items-center justify-center">
                    <Spinner size={20} />
                </div>
            )}
        </div>
    );
};
type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
    const { post, author } = props;

    return (
        <div key={post.id} className="flex gap-3 border-b border-zinc-600 p-4">
            <Image
                src={author.profilePicture}
                alt={` ${author.username} comment profile picture `}
                className=" rounded-full"
                width={56}
                height={56}
            />
            <div className="flex flex-col">
                <p className="capitalize text-zinc-400">
                    <Link href={` /@${author.username}`}>
                        <span className=" mr-1 text-teal-400">@</span>
                        {`${author.username!}`}
                    </Link>
                    <span className="mr-1 text-zinc-700">|</span>
                    <Link href={` /post/${post.id}`}>
                        <span className="text-sm text-amber-500">
                            {`${dayjs(post.createdAt).fromNow()}`}
                        </span>{" "}
                    </Link>
                </p>
                <span className="capitalize text-zinc-200">{post.content}</span>
            </div>
        </div>
    );
};

const Feed = () => {
    const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();
    if (postsLoading) return <LoadingPage />;
    if (!data) return <div>....Something went wrong.</div>;

    return (
        <div className="flex flex-col">
            {data?.map((fullPost) => (
                <PostView {...fullPost} key={fullPost.post.id} />
            ))}
        </div>
    );
};

const Home: NextPage = (props) => {
    const { isLoaded: userLoaded, isSignedIn } = useUser();

    //start fetcing asap
    api.posts.getAll.useQuery();

    // return empty div if BOTH aren't loaded since user tends to load faster
    if (!userLoaded) return <div></div>;

    return (
        <>
            <Head>
                <title>Create T3 App</title>
                <meta name="description" content="Generated by create-t3-app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="flex h-screen justify-center">
                <div className="w-full border-x border-zinc-200 bg-zinc-200 dark:bg-zinc-900 md:max-w-2xl">
                    <div className="border-b border-zinc-500 p-4">
                        {/* Sign In / Out Buttons */}

                        {!isSignedIn && (
                            <div className=" flex justify-center text-center">
                                <SignInButton />
                            </div>
                        )}
                        {isSignedIn && (
                            <div className="ml-auto flex w-fit cursor-pointer rounded-xl border border-yellow-400 px-3 py-2 text-sm opacity-70 hover:opacity-100">
                                <SignOutButton />
                            </div>
                        )}

                        {isSignedIn && <CreatePostWizard />}
                    </div>

                    <SignIn
                        path="/sign-in"
                        routing="path"
                        signUpUrl="/sign-up"
                    />

                    <Feed />
                </div>
            </main>
        </>
    );
};

export default Home;
