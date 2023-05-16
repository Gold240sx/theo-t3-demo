import { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

const blurDataURLHandler = async (
    req: NextApiRequest,
    res: NextApiResponse
) => {
    if (!req.query.url) {
        return res.status(400).json({ error: 'Missing "url" query parameter' });
    }

    try {
        const response = await fetch(req.query.url as string);
        const buffer = await response.arrayBuffer();
        const resizedImageBuffer = await sharp(Buffer.from(buffer))
            .resize(20)
            .blur()
            .toBuffer();
        const base64Image = resizedImageBuffer.toString("base64");
        res.status(200).json({
            blurDataURL: `data:image/jpeg;base64,${base64Image}`,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate blurDataURL" });
    }
};

export default blurDataURLHandler;
