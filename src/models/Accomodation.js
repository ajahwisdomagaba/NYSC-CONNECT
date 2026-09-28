import mongoose from "mongoose";

const accomodationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Annual Rent price is required"],
    },
    ppa_proximity: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      required: true,
      trim: true,
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
    photos: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "flagged", "Hidden", "Archived"],
      default: "active",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } },
);

//Compound and Standalone Indexes for geospatial Filtering and Moderations

accomodationSchema.index({ state: 1, lga: 1, status: 1 });
accomodationSchema.index({ price: 1 });

export default mongoose.model("Accommodation", accomodationSchema);
