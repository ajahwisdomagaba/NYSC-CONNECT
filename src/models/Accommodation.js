import mongoose from 'mongoose';

const TYPES = [
  'single-room',
  'self-contain',
  'room-and-parlour',
  'one-bedroom',
  'two-bedroom',
  'shared-apartment',
];

// status = is the listing live? | verificationStatus = has an admin approved it?
const STATUSES = ['active', 'inactive', 'archived'];
const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected', 'flagged'];

const AMENITIES = [
  'borehole',
  'electricity',
  'prepaid-meter',
  'security',
  'fenced',
  'tiled',
  'water-supply',
  'parking',
];

const accommodationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    accommodationType: { type: String, enum: TYPES, required: true },

    // Location (references Ibeawuchi's State / Lga collections)
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
    lga: { type: mongoose.Schema.Types.ObjectId, ref: 'Lga', required: true },
    address: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },

    // Pricing (kept separate so the UI can show the true upfront cost)
    annualRent: { type: Number, required: true, min: 1 },
    cautionFee: { type: Number, default: 0, min: 0 },
    agencyFee: { type: Number, default: 0, min: 0 },

    amenities: [{ type: String, enum: AMENITIES }],

    // Ownership / contact
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contactPhone: { type: String, required: true, trim: true },

    // Filled by the media pipeline (Ahiamadu); capped at 3 per listing
    images: {
      type: [{ url: String, publicId: String }],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: 'A listing can have at most 3 images',
      },
      default: [],
    },

    // Moderation
    status: { type: String, enum: STATUSES, default: 'active' },
    verificationStatus: { type: String, enum: VERIFICATION_STATUSES, default: 'pending' },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Indexes for the search pipeline (coordinate with Abu before adding more)
accommodationSchema.index({ status: 1, verificationStatus: 1, lga: 1, annualRent: 1 });
accommodationSchema.index({ status: 1, verificationStatus: 1, state: 1, annualRent: 1 });
accommodationSchema.index({ amenities: 1 });
accommodationSchema.index({ landlord: 1 });

const Accommodation = mongoose.model('Accommodation', accommodationSchema);

export { TYPES, STATUSES, VERIFICATION_STATUSES, AMENITIES };
export default Accommodation;
