import { db, Post, PostType, UserProfile, VisitType } from "@nicestack/common";
import { getTroubleWithRelation } from "../trouble/utils";
export async function setPostRelation(params: { data: Post, staff?: UserProfile }) {
    const { data, staff } = params
    const limitedComments = await db.post.findMany({
        where: {
            parentId: data.id,
            type: PostType.POST_COMMENT,
        },
        include: {
            author: true,
        },
        take: 5,
    });
    const commentsCount = await db.post.count({
        where: {
            parentId: data.id,
            type: PostType.POST_COMMENT,
        },
    });
    const readed =
        (await db.visit.count({
            where: {
                postId: data.id,
                visitType: VisitType.READED,
                visitorId: staff?.id,
            },
        })) > 0;
    const readedCount = await db.visit.count({
        where: {
            postId: data.id,
            visitType: VisitType.READED,
        },
    });
    const trouble = await getTroubleWithRelation(data.referenceId, staff)
    Object.assign(data, {
        readed,
        readedCount,
        limitedComments,
        commentsCount,
        trouble
    })

}