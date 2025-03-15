import axios from 'axios';
import { apiKeys } from '../config';

// TheirStack API base URL
const THEIRSTACK_API_URL = 'https://api.theirstack.com/v1';

// Create an axios instance with the API key
const theirStackClient = axios.create({
  baseURL: THEIRSTACK_API_URL,
  headers: {
    'Authorization': `Bearer ${apiKeys.theirstack}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Example function to fetch data from TheirStack API
 * Replace with actual endpoints and parameters based on TheirStack API documentation
 */
export async function fetchTheirStackData(endpoint: string, params: Record<string, any> = {}) {
  try {
    const response = await theirStackClient.get(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching data from TheirStack:', error);
    throw error;
  }
}

/**
 * Example function to post data to TheirStack API
 * Replace with actual endpoints and data structure based on TheirStack API documentation
 */
export async function postToTheirStack(endpoint: string, data: Record<string, any>) {
  try {
    const response = await theirStackClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error('Error posting data to TheirStack:', error);
    throw error;
  }
}

// Export the client for direct use if needed
export { theirStackClient }; 