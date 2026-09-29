import { searchAccommodations } from '../services/accommodation.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

// Query values arrive as strings in Express, so we convert and validate them here.
// This keeps controller logic strict without exposing raw MongoDB errors to clients.
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

// Housing feed endpoint: validate request-level input, then delegate to the search service.
// Note: this module does not own the Accommodation schema; it adapts to the existing contract.
export const getAccommodationFeed = async (req, res) => {
  try {
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
      throw new Error('Invalid page');
    }

    if (parsedLimit !== undefined && (parsedLimit < 1 || parsedLimit > 50)) {
      throw new Error('Invalid limit');
    }

    const normalizedMinPrice = parseNumber(minPrice, 'minPrice');
    const normalizedMaxPrice = parseNumber(maxPrice, 'maxPrice');

    if (
      normalizedMinPrice !== undefined &&
      normalizedMaxPrice !== undefined &&
      normalizedMinPrice > normalizedMaxPrice
    ) {
      throw new Error('Invalid price range');
    }

    const supportedSorts = ['newest', 'price_asc', 'price_desc'];
    const normalizedSort = normalizeString(sort);
    if (normalizedSort && !supportedSorts.includes(normalizedSort)) {
      throw new Error('Invalid sort');
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

    return successResponse(res, 200, 'Accommodation fetched successfully', data);
  } catch (error) {
    const message = error.message || 'Unable to fetch accommodations';
    return errorResponse(res, 400, message);
  }
};