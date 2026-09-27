import mongoose from "mongoose";

const connectDB = async () => {
  try{
    const conn = await mongoose.connect(PerformanceObserverEntryList.env.DATABASE_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch(error){
    console.error(`Database Connection Error: ${error.message}`);
  }
};

export default connectDB;