import { envs } from "@configs";
import { startMongoDB } from "@repositories";
import { authRoutes, userRoutes } from "@routes";
import express from "express";
import mongoose from "mongoose";

beforeAll((_done) => {
  startMongoDB().then(() => {
    console.log("Connected to MongoDB");
    _done();
  });
});

afterAll((_done) => {
  console.log("Dropping database");
  mongoose.connection.db
    .dropDatabase({
      dbName: envs.MONGO_DB_NAME,
      noResponse: true,
    })
    .then(() => {
      return mongoose.connection.close();
    })
    .then(() => _done());
});

export function createServer() {
  const app = express();
  app.use(express.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  return app;
}

// createServer().listen(3000, () => {
//   console.log("Server running on port 3000");
// });
