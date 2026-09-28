import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      minLength: 10,
    },
    password_hash: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    lga: {
      type: String,
      required: true,
      trim: true,
    },
    ppa_name: {
      type: String,
      default: null,
      trim: true,
    },
    role: {
      type: String,
      enum: ["corps_member", "ADMIN"],
      default: "corps_member",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);
UserSchema.index({ status: 1, lga: 1 });

export default mongoose.model("User", userSchema);
