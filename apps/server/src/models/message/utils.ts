import { Message, UserProfile, VisitType, db } from "@nicestack/common"
export async function setMessageRelation(
    data: Message,
    staff?: UserProfile,
): Promise<any> {

    const readed =
        (await db.visit.count({
            where: {
                messageId: data.id,
                visitType: VisitType.READED,
                visitorId: staff?.id,
            },
        })) > 0;


    Object.assign(data, {
        readed
    })
}