import mongoose from 'mongoose';
import Accommodation, { STATUSES, VERIFICATION_STATUSES } from '../models/Accommodation.js';
import { searchAccommodations } from '../services/accommodation.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

// Fields a client may set.
const CONTENT_FIELDS = [
  'title',
  'description',
  'accommodationType',
  'state',
  'lga',
  'address',
  'landmark',
  'price',
  'annualRent',
  'caution_fee',
  'cautionFee',
  'agency_fee',
  'agencyFee',
  'amenities',
  'property_info',
  'contact_phone',
  'contactPhone',
  'contact_whatsapp',
  'ppa_proximity',
  'photos',
  'source',
];

const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

// LGA and State validation that does not crash if Lga collection is not yet seeded
async function lgaMatchesState(lgaVal, stateVal) {
  if (!lgaVal || !stateVal) return true;
  // If ObjectId references are used
  if (mongoose.isValidObjectId(lgaVal) && mongoose.isValidObjectId(stateVal)) {
    try {
      const Lga = mongoose.models.Lga;
      if (Lga) {
        const lgaDoc = await Lga.findById(lgaVal).select('state').lean();
        return !!lgaDoc && String(lgaDoc.state) === String(stateVal);
      }
    } catch {
      return true;
    }
  }
  return true;
}

// Error handler preserving ValidationError and CastError unpacking
const catchAsync = (fn) => (req, res, next) =>
  fn(req, res, next).catch((err) => {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message).join(', ');
      return errorResponse(res, 400, messages);
    }
    if (err.name === 'CastError') {
      return errorResponse(res, 400, `Invalid value for ${err.path}`);
    }
    if (err.status || err.statusCode) {
      return errorResponse(res, err.statusCode || err.status, err.message);
    }
    console.error(err);
    return errorResponse(res, 500, err.message || 'Something went wrong');
  });

const parseNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return parsed;
};

const normalizeString = (value) => (value === undefined || value === null ? '' : String(value).trim());
const isAdmin = (user) => user && (user.role === 'admin' || user.role === 'superadmin');
const isOwner = (user, doc) => {
  if (!user || !doc) return false;
  const userId = String(user._id || user.id);
  const landlordId = doc.landlord ? String(doc.landlord) : null;
  const createdById = doc.created_by ? String(doc.created_by) : null;
  return userId === landlordId || userId === createdById;
};

// --- SEARCH & FEED (Abu Marvellous) ---
export const getAccommodationFeed = catchAsync(async (req, res) => {
  const {
    state,
    lga,
    minPrice,
    maxPrice,
    accommodationType,
    amenities,
    page = 1,
    limit = 10,
    sort = 'newest',
  } = req.query;

  const parsedPage = parseNumber(page, 'page');
  const parsedLimit = parseNumber(limit, 'limit');

  if (parsedPage !== undefined && parsedPage < 1) {
    return errorResponse(res, 400, 'Invalid page');
  }

  if (parsedLimit !== undefined && (parsedLimit < 1 || parsedLimit > 50)) {
    return errorResponse(res, 400, 'Invalid limit');
  }

  const normalizedMinPrice = parseNumber(minPrice, 'minPrice');
  const normalizedMaxPrice = parseNumber(maxPrice, 'maxPrice');

  if (
    normalizedMinPrice !== undefined &&
    normalizedMaxPrice !== undefined &&
    normalizedMinPrice > normalizedMaxPrice
  ) {
    return errorResponse(res, 400, 'Invalid price range');
  }

  const supportedSorts = ['newest', 'price_asc', 'price_desc'];
  const normalizedSort = normalizeString(sort);
  if (normalizedSort && !supportedSorts.includes(normalizedSort)) {
    return errorResponse(res, 400, 'Invalid sort');
  }

  const data = await searchAccommodations({
    state: normalizeString(state),
    lga: normalizeString(lga),
    minPrice: normalizedMinPrice,
    maxPrice: normalizedMaxPrice,
    accommodationType: normalizeString(accommodationType),
    amenities: normalizeString(amenities),
    page: parsedPage ?? 1,
    limit: parsedLimit ?? 10,
    sort: normalizedSort || 'newest',
    user: req.user || {},
  });

  return successResponse(res, 200, 'Accommodations fetched successfully', data);
});

// --- CRUD & INTAKE (Ojo Babajide) ---

// POST /api/v1/accommodations (Admin / Landlord)
export const createAccommodation = catchAsync(async (req, res) => {
  const user = req.user || {};

  if (user.role === 'landlord' && !user.isVetted) {
    return errorResponse(res, 403, 'Your landlord account has not been verified yet');
  }

  const data = pick(req.body, CONTENT_FIELDS);

  // Field Normalizations
  if (data.annualRent && !data.price) data.price = data.annualRent;
  if (data.cautionFee && !data.caution_fee) data.caution_fee = data.cautionFee;
  if (data.agencyFee && !data.agency_fee) data.agency_fee = data.agencyFee;
  if (data.contactPhone && !data.contact_phone) data.contact_phone = data.contactPhone;

  if (!(await lgaMatchesState(data.lga, data.state))) {
    return errorResponse(res, 400, 'LGA does not belong to the selected state');
  }

  const doc = new Accommodation({
    ...data,
    created_by: user._id || null,
    last_updated_by: user._id || null,
  });

  if (isAdmin(user)) {
    if (req.body.landlord && mongoose.isValidObjectId(req.body.landlord)) {
      doc.landlord = req.body.landlord;
    }
    if (req.body.status && STATUSES.includes(req.body.status)) {
      doc.status = req.body.status;
    }
    if (req.body.verificationStatus && VERIFICATION_STATUSES.includes(req.body.verificationStatus)) {
      doc.verification_status = req.body.verificationStatus;
    }
  } else {
    doc.landlord = user._id || null;
    doc.status = 'active';
    doc.verification_status = 'pending';
  }

  await doc.save();
  return successResponse(res, 201, 'Accommodation created successfully', doc);
});

// GET /api/v1/accommodations/:id
export const getAccommodation = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return errorResponse(res, 404, 'Listing not found');
  }

  let query = Accommodation.findById(id);

  // Conditionally populate if models exist
  if (mongoose.models.State) query = query.populate('state', 'name');
  if (mongoose.models.Lga) query = query.populate('lga', 'name');
  if (mongoose.models.User) query = query.populate('landlord', 'name phone email');

  const doc = await query;
  if (!doc) {
    return errorResponse(res, 404, 'Listing not found');
  }

  const isPublic = doc.status === 'active' && doc.verification_status === 'verified';
  const canSee = isPublic || isAdmin(req.user) || isOwner(req.user, doc);

  if (!canSee) {
    return errorResponse(res, 404, 'Listing not found');
  }

  return successResponse(res, 200, 'Accommodation fetched successfully', doc);
});

// PUT /api/v1/accommodations/:id (Admin / Owner)
export const updateAccommodation = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return errorResponse(res, 404, 'Listing not found');
  }

  const doc = await Accommodation.findById(id);
  if (!doc) {
    return errorResponse(res, 404, 'Listing not found');
  }

  const admin = isAdmin(req.user);
  if (!admin && !isOwner(req.user, doc)) {
    return errorResponse(res, 403, 'You can only edit your own listings');
  }

  const updates = pick(req.body, CONTENT_FIELDS);
  if (updates.annualRent && !updates.price) updates.price = updates.annualRent;
  if (updates.cautionFee && !updates.caution_fee) updates.caution_fee = updates.cautionFee;
  if (updates.agencyFee && !updates.agency_fee) updates.agency_fee = updates.agencyFee;
  if (updates.contactPhone && !updates.contact_phone) updates.contact_phone = updates.contactPhone;

  const nextState = updates.state || doc.state;
  const nextLga = updates.lga || doc.lga;
  if ((updates.state || updates.lga) && !(await lgaMatchesState(nextLga, nextState))) {
    return errorResponse(res, 400, 'LGA does not belong to the selected state');
  }

  doc.set(updates);
  if (req.user && req.user._id) {
    doc.last_updated_by = req.user._id;
  }
  doc.last_updated_at = new Date();

  if (admin) {
    const { status, verificationStatus } = req.body;
    if (status && STATUSES.includes(status)) doc.status = status;
    if (verificationStatus && VERIFICATION_STATUSES.includes(verificationStatus)) {
      doc.verification_status = verificationStatus;
    }
  } else if (Object.keys(updates).length && doc.verification_status === 'verified') {
    doc.verification_status = 'pending';
  }

  await doc.save();
  return successResponse(res, 200, 'Accommodation updated successfully', doc);
});

// DELETE /api/v1/accommodations/:id (Soft delete: archive)
export const deleteAccommodation = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return errorResponse(res, 404, 'Listing not found');
  }

  const doc = await Accommodation.findById(id);
  if (!doc) {
    return errorResponse(res, 404, 'Listing not found');
  }

  if (!isAdmin(req.user) && !isOwner(req.user, doc)) {
    return errorResponse(res, 403, 'You can only delete your own listings');
  }

  doc.status = 'archived';
  await doc.save();

  return successResponse(res, 200, 'Listing archived successfully');
});