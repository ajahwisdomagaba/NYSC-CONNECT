import Accommodation from '../models/Accommodation.js';
import { buildAccommodationQuery } from '../utils/buildAccommodationQuery.js';
import { buildPaginationResponse, validatePagination } from '../utils/pagination.js';

// Sort values are intentionally restricted to a small approved list.
// This avoids exposing arbitrary Mongo sort fields directly from request data.
const resolveSort = (sortValue = 'newest') => {
  switch (sortValue) {
    case 'newest':
      return { createdAt: -1 };
    case 'price_asc':
      return { annualRent: 1 };
    case 'price_desc':
      return { annualRent: -1 };
    default:
      throw new Error('Invalid sort');
  }
};

// Search responsibilities are separated from the controller:
// 1) validate pagination
// 2) build the Mongo filters
// 3) apply sort + skip + limit
// 4) return the paginated feed response
export const searchAccommodations = async ({
  state,
  lga,
  minPrice,
  maxPrice,
  accommodationType,
  amenities,
  page = 1,
  limit = 10,
  sort = 'newest',
  user = {},
}) => {
  const { page: safePage, limit: safeLimit, skip } = validatePagination({ page, limit });
  const filters = buildAccommodationQuery({
    state,
    lga,
    minPrice,
    maxPrice,
    accommodationType,
    amenities,
    userState: user.state,
    userLga: user.lga,
  });

  const sortOptions = resolveSort(sort);

  const [results, total] = await Promise.all([
    Accommodation.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Accommodation.countDocuments(filters),
  ]);

  return {
    ...buildPaginationResponse({ total, page: safePage, limit: safeLimit }),
    results,
  };
};
