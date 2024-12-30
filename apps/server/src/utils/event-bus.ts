import mitt from 'mitt';
import { ObjectType, ChangedRows, UserProfile, MessageDto } from '@nicestack/common';
export enum CrudOperation {
  CREATED,
  UPDATED,
  DELETED
}
type Events = {
  genDataEvent: { type: "start" | "end" },
  markDirty: { objectType: string, id: string, staff?: UserProfile, subscribers?: string[] }
  updateViewCount: { id: string, objectType: ObjectType },
  onMessageCreated: { data: Partial<MessageDto> },
  dataChanged: { type: string, operation: CrudOperation, data: any }
};
const EventBus = mitt<Events>();
export default EventBus;
