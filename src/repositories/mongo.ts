import mongoose from "mongoose";
import { envs } from "@configs";

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(envs.MONGO_URI, {
      dbName: envs.MONGO_DB_NAME,
    });
    console.log("Mongoose default connection is open");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
};

export const startMongoDB = async () => {
  await connectMongoDB();
};
