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
import PageLoader from "next/dist/client/page-loader";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postView";

const CreatePostWizard = () => {
    const { user } = useUser();
    // Should use React-hook-form instead of state
    // share the validator on both back and front and
    // use the same validator for both the mutation and the form
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
                disabled={isPosting}
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
            <PageLayout>
                {/* Sign In / Out Buttons */}
                <div className="ml-auto flex flex-col border-b border-slate-400 p-4">
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

                <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />

                <Feed />
            </PageLayout>
        </>
    );
};

export default Home;
