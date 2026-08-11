import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  mongoose.connection.on("connected", () => {
    console.log(`MongoDB connected -> ${mongoose.connection.name}`);
  });
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });
  await mongoose.connect(uri);
}
