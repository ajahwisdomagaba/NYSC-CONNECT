import mongoose from 'mongoose';
import Accommodation, { STATUSES, VERIFICATION_STATUSES } from '../models/Accommodation.js';
import Lga from '../models/Lga.js'; // owned by Chibueze; expected field: state (ObjectId)

// Fields a client may set. Anything else in req.body is ignored.
const CONTENT_FIELDS = [
  'title', 'description', 'accommodationType', 'state', 'lga', 'address', 'landmark',
  'annualRent', 'cautionFee', 'agencyFee', 'amenities', 'contactPhone',
];

const fail = (res, code, message) => res.status(code).json({ status: 'error', message });

const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

const catchAsync = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    if (err.name === 'ValidationError') {
      return fail(res, 400, Object.values(err.errors).map((e) => e.message).join(', '));
    }
    if (err.name === 'CastError') return fail(res, 400, `Invalid value for ${err.path}`);
    console.error(err);
    return fail(res, 500, 'Something went wrong');
  });

// LGA must exist and belong to the chosen state
async function lgaMatchesState(lgaId, stateId) {
  if (!mongoose.isValidObjectId(lgaId) || !mongoose.isValidObjectId(stateId)) return false;
  const lga = await Lga.findById(lgaId).select('state').lean();
  return !!lga && String(lga.state) === String(stateId);
}

const isAdmin = (user) => user.role === 'admin';
const isOwner = (user, doc) => doc.landlord && String(doc.landlord) === String(user._id);

// POST /api/v1/accommodations  (admin, landlord)
export const createAccommodation = catchAsync(async (req, res) => {
  const { user } = req;

  // "Vetted" landlords only. Agree the field name with Victory (User schema).
  if (user.role === 'landlord' && !user.isVetted) {
    return fail(res, 403, 'Your landlord account has not been verified yet');
  }

  const data = pick(req.body, CONTENT_FIELDS);

  if (!(await lgaMatchesState(data.lga, data.state))) {
    return fail(res, 400, 'LGA does not belong to the selected state');
  }

  const doc = new Accommodation({ ...data, createdBy: user._id });

  if (isAdmin(user)) {
    // Admin intake: can attach a landlord and publish directly
    if (req.body.landlord && mongoose.isValidObjectId(req.body.landlord)) {
      doc.landlord = req.body.landlord;
    }
    if (STATUSES.includes(req.body.status)) {
      doc.status = req.body.status;
    }
    if (VERIFICATION_STATUSES.includes(req.body.verificationStatus)) {
      doc.verificationStatus = req.body.verificationStatus;
    }
    if (doc.verificationStatus === 'verified') {
      doc.verifiedBy = user._id;
      doc.verifiedAt = new Date();
    }
  } else {
    doc.landlord = user._id;
    doc.status = 'active';
    doc.verificationStatus = 'pending'; // hidden from search until an admin verifies
  }

  await doc.save();
  return res.status(201).json({ status: 'success', data: doc });
});

// GET /api/v1/accommodations/:id
export const getAccommodation = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return fail(res, 404, 'Listing not found');

  const doc = await Accommodation.findById(id)
    .populate('state', 'name')
    .populate('lga', 'name')
    .populate('landlord', 'name phone');

  // Public = active AND verified. Everyone else sees only admins/owner access.
  const isPublic = doc && doc.status === 'active' && doc.verificationStatus === 'verified';
  const canSee = doc && (isAdmin(req.user) || isOwner(req.user, doc) || isPublic);
  if (!canSee) return fail(res, 404, 'Listing not found');

  return res.json({ status: 'success', data: doc });
});

// PUT /api/v1/accommodations/:id  (admin, owning landlord)
export const updateAccommodation = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return fail(res, 404, 'Listing not found');

  const doc = await Accommodation.findById(id);
  if (!doc) return fail(res, 404, 'Listing not found');

  const admin = isAdmin(req.user);
  if (!admin && !isOwner(req.user, doc)) {
    return fail(res, 403, 'You can only edit your own listings');
  }

  const updates = pick(req.body, CONTENT_FIELDS);
  const nextState = updates.state || doc.state;
  const nextLga = updates.lga || doc.lga;
  if ((updates.state || updates.lga) && !(await lgaMatchesState(nextLga, nextState))) {
    return fail(res, 400, 'LGA does not belong to the selected state');
  }

  doc.set(updates);

  if (admin) {
    const { status, verificationStatus } = req.body;
    if (status !== undefined) {
      if (!STATUSES.includes(status)) return fail(res, 400, 'Invalid status');
      doc.status = status;
    }
    if (verificationStatus !== undefined) {
      if (!VERIFICATION_STATUSES.includes(verificationStatus)) {
        return fail(res, 400, 'Invalid verificationStatus');
      }
      doc.verificationStatus = verificationStatus;
      if (verificationStatus === 'verified') {
        doc.verifiedBy = req.user._id;
        doc.verifiedAt = new Date();
      }
    }
  } else if (Object.keys(updates).length && doc.verificationStatus === 'verified') {
    // Landlord edited a verified listing: send it back for re-review
    doc.verificationStatus = 'pending';
    doc.verifiedBy = undefined;
    doc.verifiedAt = undefined;
  }

  await doc.save();
  return res.json({ status: 'success', data: doc });
});

// DELETE /api/v1/accommodations/:id  (soft delete: archives the listing)
export const deleteAccommodation = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return fail(res, 404, 'Listing not found');

  const doc = await Accommodation.findById(id);
  if (!doc) return fail(res, 404, 'Listing not found');

  if (!isAdmin(req.user) && !isOwner(req.user, doc)) {
    return fail(res, 403, 'You can only delete your own listings');
  }

  // Soft delete keeps saved items and reports pointing at a valid record
  doc.status = 'archived';
  await doc.save();
  return res.json({ status: 'success', message: 'Listing archived' });
});
