/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataView, DataViewModel } from "./models";
import { DataWithId } from "../interfaces/mongoose.common";
import mongoose, { Document, FilterQuery, Model, Types } from "mongoose";
import assert from "assert";

export type THydratedDocumentType<TRawDocType> = Document<
  unknown,
  {},
  TRawDocType
> &
  TRawDocType & {
    _id: Types.ObjectId;
  };

export type GeneralFilterQuery<T> =
  | {
      _id: Types.ObjectId;
    }
  | FilterQuery<T>;

export function isFilterById<T>(
  filter: GeneralFilterQuery<T>
): filter is { _id: Types.ObjectId } {
  return "_id" in filter;
}

export type TQueryHelpers = {};

export type MongooseModelOf<TRawDocType> = Model<
  TRawDocType,
  TQueryHelpers,
  {},
  {},
  THydratedDocumentType<TRawDocType>,
  any
>;

export type HydratedDocumentWithDataViews<TRawDocType> = {
  data: THydratedDocumentType<TRawDocType>;
  dataViews: Array<DataView>;
  _rawDataViews: Array<THydratedDocumentType<DataView>>;
};
export type HydratedDocumentWithSingleDataView<TRawDocType> = {
  data: THydratedDocumentType<TRawDocType>;
  dataView: DataView | null;
  _rawDataView: THydratedDocumentType<DataView> | null;
};

export const refineHydratedDataView = (
  dataView: THydratedDocumentType<DataView>
): DataView => {
  return {
    data_id: dataView.data_id,
    user_public_key: dataView.user_public_key,
    field_permissions: dataView.field_permissions.map((permission) => {
      return {
        field_name: permission.field_name,
        permission: permission.permission,
        encrypted_password: permission.encrypted_password,
      };
    }),
  };
};

export const toHexStringDataId = (dataView: DataView) => {
  return {
    ...dataView,
    data_id: dataView.data_id.toHexString(),
  };
};

export class BaseDataViewRepository<TRawDocType> {
  model: MongooseModelOf<TRawDocType>;

  constructor(model: MongooseModelOf<TRawDocType>) {
    this.model = model;
  }

  async create(
    data: TRawDocType,
    userDataViews: Array<Omit<DataView, "data_id">>
  ): Promise<HydratedDocumentWithDataViews<TRawDocType>> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // create data
      const mongooseDataInput = new this.model(data);
      const createdDataDocument = await mongooseDataInput.save();

      // create data views
      const createdDataViews = await Promise.all(
        userDataViews.map((view) => {
          const userDataViewInput = new DataViewModel({
            ...view,
            data_id: createdDataDocument._id,
          });
          return userDataViewInput.save();
        })
      );

      await session.endSession();
      const res: HydratedDocumentWithDataViews<TRawDocType> = {
        data: createdDataDocument,
        dataViews: createdDataViews.map((x) => refineHydratedDataView(x)), // MUST
        _rawDataViews: createdDataViews,
      };

      return res;
    } catch (error) {
      console.error("abort transaction", error);
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  }

  async updateOne(
    objectId: Types.ObjectId,
    data: Partial<TRawDocType>,
    userDataViews: Array<Omit<DataView, "data_id">>,
    userPublicKey: string
  ): Promise<HydratedDocumentWithDataViews<TRawDocType>> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const currentDataRes = await this.findOneWithDataViews({ _id: objectId });
      if (!currentDataRes)
        throw new Error(`Data not found for id ${Types.ObjectId.toString()}`);

      const { data: currentData, _rawDataViews: currentDataViews } =
        currentDataRes;
      const currentUserView = currentDataViews.find(
        (x) => x.user_public_key === userPublicKey
      );
      const updatedDataViews: Map<Types.ObjectId, boolean> = new Map();

      for (const field in data) {
        // TODO: might check in schema instead
        if (field in currentData) {
          const isValidAndRequiredField =
            field in this.model.schema.paths
              ? this.model.schema.paths[field].required
              : false;
          assert(
            isValidAndRequiredField,
            `Field ${field} is not a required field in ${this.model.modelName} schema and cannot be updated`
          );
        }

        // current user must have write/owner permission for the updated field
        assert(
          currentUserView &&
            currentUserView.field_permissions.find(
              (x) =>
                (x.field_name === field && x.permission === "WRITE") ||
                x.permission === "OWNER"
            ),

          `User ${userPublicKey} does not have permission to update field ${field}`
        );

        // validate data views updated for corresponding stakeholders
        currentDataViews.map((view) => {
          const fieldPermission = view.field_permissions.find(
            (x) => x.field_name === field
          );
          if (fieldPermission) {
            const newPermission = userDataViews
              .find((newView) => {
                return newView.user_public_key === view.user_public_key;
              })
              ?.field_permissions.find(
                (x) =>
                  x.field_name === field &&
                  x.permission === fieldPermission.permission
              );

            assert(
              newPermission,
              `New encrypted view of field ${field} not found for user ${view.user_public_key}`
            );
            // TODO: validate consistency of new encrypted password for all guests
            fieldPermission.encrypted_password =
              newPermission.encrypted_password;

            updatedDataViews.set(view._id, true);
          }
        });
      }

      // save new data
      const updatedData = await this.model.findByIdAndUpdate(
        currentData._id,
        data,
        { new: true }
      );

      if (!updatedData)
        throw new Error("Data not found for id " + currentData._id.toString());

      const updatedDataViewDocs = currentDataViews.filter((x) =>
        updatedDataViews.has(x._id)
      );

      await Promise.all(updatedDataViewDocs.map((doc) => doc.save()));

      // TODO: debug & switch to bulkSave

      await this.model.bulkSave(updatedDataViewDocs);

      const res = await this.findOneWithDataViews({ _id: updatedData._id });
      if (!res) {
        throw new Error("Data not found for id " + updatedData._id.toString());
      }

      return res;
    } catch (error) {
      console.error("abort transaction", error);
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  }

  // Be careful, must be owner
  async delete(dataId: Types.ObjectId): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await this.model.deleteOne({ _id: dataId } as any); // TODO: fix any
      await DataViewModel.deleteMany({ data_id: dataId });

      await session.endSession();
    } catch (error) {
      console.error("abort transaction", error);
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  }

  async getDataViewByDataId(
    dataId: Types.ObjectId
  ): Promise<Array<DataWithId<DataView>>> {
    const res = await DataViewModel.find({ data_id: dataId });
    if (res.length <= 0)
      throw new Error("Data views not found for data " + dataId.toString());
    return res;
  }
  async findByDataIdAndUserPublicKey(
    dataId: Types.ObjectId,
    userPublicKey: string
  ): Promise<DataWithId<DataView>> {
    const res = await DataViewModel.findOne({
      data_id: dataId,
      user_public_key: userPublicKey,
    });
    if (!res)
      throw new Error(
        `Data view not found for data ${dataId.toString()} and user ${userPublicKey}`
      );
    return res;
  }

  // get all data views of the data
  async findOneWithDataViews(
    filter: GeneralFilterQuery<TRawDocType>
  ): Promise<HydratedDocumentWithDataViews<TRawDocType> | null> {
    const res = isFilterById(filter)
      ? await this.model.findById(filter._id)
      : await this.model.findOne(filter);
    if (!res) return null;
    const views = await DataViewModel.find({ data_id: res._id });
    return {
      data: res,
      dataViews: views.map((view) => refineHydratedDataView(view)),
      _rawDataViews: views,
    };
  }

  // get only one data view of the data
  async findOneWithUserDataView(
    filter: GeneralFilterQuery<TRawDocType>,
    userPublicKey?: string
  ): Promise<HydratedDocumentWithSingleDataView<TRawDocType> | null> {
    const res = isFilterById(filter)
      ? await this.model.findById(filter._id)
      : await this.model.findOne(filter);
    if (!res) return null;
    const view = userPublicKey
      ? await DataViewModel.findOne({
          data_id: res._id,
          user_public_key: userPublicKey,
        })
      : null;
    return {
      data: res,
      dataView: view && refineHydratedDataView(view),
      _rawDataView: view,
    };
  }

  // only get the data
  async findOne(
    query: FilterQuery<TRawDocType>
  ): Promise<THydratedDocumentType<TRawDocType> | null> {
    const res = await this.model.findOne(query);
    if (!res) return null;
    return res;
  }
}
