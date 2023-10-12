import mongoose from "mongoose";
import dotenv from "dotenv";

// This to connect the server to database
dotenv.config();

export function dataBaseConnection() {
  const params = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  try {
    mongoose.connect(process.env.MONGO_URL, params);
    console.log("MongoDB is connected");
  } catch (err) {
    console.log("MongoDB Connection Error: ", err);
  }
}
