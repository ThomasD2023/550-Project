/**
 * @fileoverview Centralized API client for all backend requests.
 * Base URL from VITE_API_URL environment variable.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Generic fetch wrapper with error handling.
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API Error: ${res.status}`);
  }
  return res.json();
}

// ===== Region Endpoints =====
export const getTopRegions = (limit = 10) =>
  apiFetch(`/api/regions/top?limit=${limit}`);

export const getDiningScores = (minVineyards = 3) =>
  apiFetch(`/api/regions/dining-scores?min_vineyards=${minVineyards}`);

export const getOutdoorRegions = (limit = 20) =>
  apiFetch(`/api/regions/outdoor?limit=${limit}`);

// ===== Vineyard Endpoints =====
export const searchVineyards = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.country) qs.set('country', params.country);
  if (params.state) qs.set('state', params.state);
  if (params.city) qs.set('city', params.city);
  if (params.name) qs.set('name', params.name);
  qs.set('limit', params.limit || 20);
  qs.set('offset', params.offset || 0);
  return apiFetch(`/api/vineyards?${qs}`);
};

export const getVineyardById = (id) =>
  apiFetch(`/api/vineyards/${id}`);

export const getNearbyHotels = (id, radius = 50) =>
  apiFetch(`/api/vineyards/${id}/hotels?radius=${radius}`);

export const getNearbyPois = (id, radius = 50) =>
  apiFetch(`/api/vineyards/${id}/pois?radius=${radius}`);

export const getNearbyRestaurants = (id, radius = 50) =>
  apiFetch(`/api/vineyards/${id}/restaurants?radius=${radius}`);

// ===== Location Endpoints =====
export const getCountries = () => apiFetch('/api/locations/countries');
export const getStates = (country) =>
  apiFetch(`/api/locations/states?country=${encodeURIComponent(country)}`);
export const getCities = (state) =>
  apiFetch(`/api/locations/cities?state=${encodeURIComponent(state)}`);

// ===== City Endpoints =====
export const searchCities = (q) =>
  apiFetch(`/api/cities/search?q=${encodeURIComponent(q)}`);
export const getCityBundle = (cityId, minRating) => {
  let url = `/api/cities/${cityId}/bundle`;
  if (minRating) url += `?min_rating=${minRating}`;
  return apiFetch(url);
};

// ===== Hotel Endpoints =====
export const filterHotels = (params = {}) => {
  const qs = new URLSearchParams();
  qs.set('min_rating', params.minRating || 1);
  if (params.country) qs.set('country', params.country);
  qs.set('limit', params.limit || 20);
  qs.set('offset', params.offset || 0);
  return apiFetch(`/api/hotels?${qs}`);
};

// ===== Restaurant Endpoints =====
export const filterRestaurants = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.cuisine) qs.set('cuisine', params.cuisine);
  if (params.award) qs.set('award', params.award);
  if (params.country) qs.set('country', params.country);
  qs.set('limit', params.limit || 20);
  qs.set('offset', params.offset || 0);
  return apiFetch(`/api/restaurants?${qs}`);
};

// ===== POI Endpoints =====
export const browsePois = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.country) qs.set('country', params.country);
  if (params.search) qs.set('search', params.search);
  qs.set('limit', params.limit || 20);
  qs.set('offset', params.offset || 0);
  return apiFetch(`/api/pois?${qs}`);
};

export const getCategoryStats = (limit = 20) =>
  apiFetch(`/api/categories/stats?limit=${limit}`);

// ===== Stats =====
export const getGlobalStats = () => apiFetch('/api/stats');

// ===== Auth Endpoints =====
export const authLogin = (email, password) =>
  apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

export const authRegister = (email, password, displayName) =>
  apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });

export const authMe = () => apiFetch('/auth/me');

export const authLogout = () =>
  apiFetch('/auth/logout', { method: 'POST' });
