import mongoose from 'mongoose';

// Shared helpers for safely normalizing query strings.
// We avoid trusting raw req.query values and trim/escape them before building Mongo filters.
const normalizeValue = (value) => String(value ?? '').trim();

const normalizeEnumValue = (value) => normalizeValue(value).toLowerCase().replace(/[_\s]+/g, '-');

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toObjectIdOrValue = (value) => {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(normalized)) {
    return new mongoose.Types.ObjectId(normalized);
  }

  return normalized;
};

// Amenities are accepted as a comma-delimited string such as "borehole,electricity".
// The schema contract allows a final agreed list; we keep the parsing flexible until that list is frozen.
const parseAmenities = (amenities) => {
  if (!amenities) {
    return [];
  }

  if (Array.isArray(amenities)) {
    return amenities
      .map((item) => normalizeEnumValue(item))
      .filter(Boolean);
  }

  return String(amenities)
    .split(',')
    .map((item) => normalizeEnumValue(item))
    .filter(Boolean);
};

// Base feed contract: normal housing search should only include listings that are both
// verified and active. This keeps status and verificationStatus separate as required.
export const buildAccommodationQuery = ({
  state,
  lga,
  minPrice,
  maxPrice,
  accommodationType,
  amenities,
  userState,
  userLga,
} = {}) => {
  const filters = {
    verification_status: 'verified',
    status: 'active',
  };

  const selectedState = toObjectIdOrValue(state) ?? toObjectIdOrValue(userState);
  if (selectedState) {
    if (selectedState instanceof mongoose.Types.ObjectId) {
      filters.state = selectedState;
    } else {
      filters.state = new RegExp(`^${escapeRegExp(selectedState)}$`, 'i');
    }
  }

  const selectedLga = toObjectIdOrValue(lga) ?? toObjectIdOrValue(userLga);
  if (selectedLga) {
    if (selectedLga instanceof mongoose.Types.ObjectId) {
      filters.lga = selectedLga;
    } else {
      filters.lga = new RegExp(`^${escapeRegExp(selectedLga)}$`, 'i');
    }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const parsedMinPrice = minPrice === undefined || minPrice === '' ? undefined : Number(minPrice);
    const parsedMaxPrice = maxPrice === undefined || maxPrice === '' ? undefined : Number(maxPrice);

    if (
      (minPrice !== undefined && minPrice !== '' && Number.isNaN(parsedMinPrice)) ||
      (maxPrice !== undefined && maxPrice !== '' && Number.isNaN(parsedMaxPrice))
    ) {
      throw new Error('Invalid price range');
    }

    if (
      parsedMinPrice !== undefined &&
      parsedMaxPrice !== undefined &&
      parsedMinPrice > parsedMaxPrice
    ) {
      throw new Error('Invalid price range');
    }

    if (parsedMinPrice !== undefined || parsedMaxPrice !== undefined) {
      filters.annualRent = {};

      if (parsedMinPrice !== undefined) {
        filters.annualRent.$gte = parsedMinPrice;
      }

      if (parsedMaxPrice !== undefined) {
        filters.annualRent.$lte = parsedMaxPrice;
      }
    }
  }

  const normalizedType = normalizeEnumValue(accommodationType);
  if (normalizedType) {
    filters.accommodationType = normalizedType;
  }

  const amenityValues = parseAmenities(amenities);
  if (amenityValues.length) {
    filters.amenities = { $all: amenityValues };
  }

  return filters;
};
