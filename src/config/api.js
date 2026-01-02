// API Configuration
// Uses environment variable REACT_APP_API_URL if set, otherwise defaults to production backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://fm-backend.founder-match.in';

export const API_URL = API_BASE_URL;
export const API_BASE = `${API_BASE_URL}/api`;

export default API_BASE_URL;

