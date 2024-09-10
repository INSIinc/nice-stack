import { Injectable } from '@nestjs/common';
import { ObjectType, RelationType, db, Relation } from "@nicestack/common";

/**
 * Service dealing with relation entities.
 */
@Injectable()
export class RelationService {

    /**
     * Create a new relation object.
     * 
     * @param {string} aId - The ID of the related entity.
     * @param {string} bId - The ID of the target object.
     * @param {ObjectType} bType - The type of the target object.
     * @param {RelationType} relationType - The type of the relation.
     * @returns {{aId: string, bId: string, aType:ObjectType, bType: ObjectType, relationType: RelationType}} An object representing the created relation.
     */
    buildRelation(aId: string, bId: string, aType: ObjectType, bType: ObjectType, relationType: RelationType): { aId: string; bId: string; aType: ObjectType; bType: ObjectType; relationType: RelationType; } {
        return {
            aId,
            bId,
            aType,
            bType,
            relationType
        };
    }
    
    /**
     * Find relations based on entity type, relation type, object type, and entity ID.
     * 
     * @param {ObjectType} aType - The type of the entity.
     * @param {RelationType} relationType - The type of the relation.
     * @param {ObjectType} bType - The type of the object.
     * @param {string} aId - The ID of the entity to find relations for.
     * @param {number} [limit] - Optional limit on the number of results.
     * @returns {Promise<Array>} A promise that resolves to an array of relation objects.
     */
    async getERO(aType: ObjectType, relationType: RelationType, bType: ObjectType, aId: string, limit?: number): Promise<Array<Relation>> {
        return await db.relation.findMany({
            where: {
                aType,
                relationType,
                bType,
                aId
            },
            take: limit  // Add the limit if provided
        });
    }
    /**
       * Find relations based on entity type, relation type, object type, and entity ID.
       * 
       * @param {ObjectType} aType - The type of the entity.
       * @param {RelationType} relationType - The type of the relation.
       * @param {ObjectType} bType - The type of the object.
       * @param {string} aId - The ID of the entity to find relations for.
       * @param {number} [limit] - Optional limit on the number of results.
       * @returns {Promise<number>} A promise that resolves to an array of relation objects.
       */
    async getEROCount(aType: ObjectType, relationType: RelationType, bType: ObjectType, aId: string): Promise<number> {
        return await db.relation.count({
            where: {
                aType,
                relationType,
                bType,
                aId
            }
        });
    }

    /**
     * Get the IDs of objects related to a specific entity.
     * 
     * @param {ObjectType} aType - The type of the entity.
     * @param {RelationType} relationType - The type of the relation.
     * @param {ObjectType} bType - The type of the object.
     * @param {string} aId - The ID of the entity to get related object IDs for.
     * @param {number} [limit] - Optional limit on the number of results.
     * @returns {Promise<Array<string>>} A promise that resolves to an array of object IDs.
     */
    async getEROBids(aType: ObjectType, relationType: RelationType, bType: ObjectType, aId: string, limit?: number): Promise<Array<string>> {
        const res = await this.getERO(aType, relationType, bType, aId, limit);
        return res.map(relation => relation.bId);
    }
}
