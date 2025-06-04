import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export async function register(userData) {
  return axios.post(`${API_BASE_URL}/register`, userData);
}

export async function login(username, password) {
  return axios.post(`${API_BASE_URL}/login`, { username, password });
}

export async function getProfile(token) {
  return axios.get(`${API_BASE_URL}/profile`, {   // <-- แก้ตรงนี้
    headers: { Authorization: `Bearer ${token}` }
  });
}
