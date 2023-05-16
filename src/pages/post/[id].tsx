import type { NextPage, GetStaticProps, InferGetStaticPropsType } from "next";
import { generateSSGHelper } from "../../server/helpers/ssgHelper";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postView";

const SinglePostPage: NextPage<{ id: string }> = ({
        id,
    }: InferGetStaticPropsType<typeof getStaticProps>) => {
    const { data } = api.posts.getById.useQuery({
        id,
    });
    if (!data) return <div>404</div>;

    return (
        <>
            <Head>
                <title>{`${data.post.content} - @${data.author.username}`}</title>
                <meta name="description" content="Generated by create-t3-app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <PageLayout>
                <PostView {...data} />
            </PageLayout>
        </>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const ssg = generateSSGHelper();

    const id = context.params?.id;
    if (typeof id !== "string") throw new Error("no id");

    // prefetch data and hydrate through server-side props
    await ssg.posts.getById.prefetch({ id });

    // in the future where data changes, custom refetching / revalidate times goes here:
    return {
        props: {
            trpcState: ssg.dehydrate(),
            id,
        },
    };
};

export const getStaticPaths = () => {
    return { paths: [], fallback: "blocking" };
};

export default SinglePostPage;
