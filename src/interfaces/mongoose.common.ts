import { Types } from "mongoose";

export type DataWithId<T> = T & {
  _id: Types.ObjectId;
};
