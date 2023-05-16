import Link from "next/link";
import { RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import Image from "next/image";

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = (props: PostWithUser) => {
    const { post, author } = props;

    return (
        <div key={post.id} className="flex gap-3 border-b border-zinc-600 p-4">
            <Link href={` /@${author.username}`}>
                <Image
                    src={author.profilePicture}
                    alt={` ${author.username} comment profile picture `}
                    className=" rounded-full"
                    width={56}
                    height={56}
                />
            </Link>
            <div className="flex flex-col">
                <p className="capitalize text-zinc-400">
                    <Link href={` /@${author.username}`}>
                        <span className=" mr-0.5 text-teal-400">@</span>
                        {`${author.username!}`}
                    </Link>
                    <span className=" mx-1 text-zinc-700">|</span>
                    <Link href={` /post/${post.id}`}>
                        <span className=" text-sm text-amber-500">
                            {`${dayjs(post.createdAt).fromNow()}`}
                        </span>{" "}
                    </Link>
                </p>
                <span className="capitalize text-zinc-200">{post.content}</span>
            </div>
        </div>
    );
};
