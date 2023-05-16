import type { NextPage, GetStaticProps, InferGetStaticPropsType } from "next";
import { generateSSGHelper } from "../server/helpers/ssgHelper";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import Image from "next/image";
import LoadingPage from "~/components/spinner";
import { PostView } from "~/components/postView";

const ProfileFeed = (props: { userId: string }) => {
    const { data, isLoading } = api.posts.getPostsByUserId.useQuery({
        userId: props.userId,
    });

    if (isLoading) return <LoadingPage />;
    if (!data || data.length === 0) return <div>User has no posts yet!</div>;

    return (
        <div className="flex flex-col">
            {data.map((fullPost) => (
                <PostView {...fullPost} key={fullPost.post.id} />
            ))}
        </div>
    );
};

const ProfilePage: NextPage<{ username: string }> = ({
        username,
    }: InferGetStaticPropsType<typeof getStaticProps>) => {
    const { data } = api.profile.getUserByUsername.useQuery({
        username,
    });
    if (!data) return <div>404</div>;

    return (
        <>
            <Head>
                <title>{data.username}</title>
                <meta name="description" content="Generated by create-t3-app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <PageLayout>
                <div className="relative h-48 border-b border-zinc-400 bg-zinc-600">
                    <Image
                        src={data.profilePicture}
                        alt={` ${data.username ?? ""} profile picture `}
                        width={128}
                        height={128}
                        className="absolute bottom-0 left-0 -mb-16 ml-6 rounded-full border-4 border-black bg-black "
                    />
                </div>
                <div className="h-16"></div>
                <div className="px-6 py-4 text-2xl capitalize text-teal-400">
                    @
                    <span className="ml-0.5 font-bold text-zinc-200">
                        {`${data.username ?? ""}`}
                    </span>
                </div>
                <div className="border-full border-b border-zinc-400"></div>
                <ProfileFeed userId={data.id} />
            </PageLayout>
        </>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const ssg = generateSSGHelper();

    const slug = context.params?.slug as string;
    if (typeof slug !== "string") throw new Error("no Slug");

    const username = slug.replace("@", "");

    // prefetch data and hydrate through server-side props
    await ssg.profile.getUserByUsername.prefetch({ username });

    return {
        props: {
            trpcState: ssg.dehydrate(),
            username,
        },
    };
};

export const getStaticPaths = () => {
    return { paths: [], fallback: "blocking" };
};

export default ProfilePage;
