// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
import { apiRequest } from "./queryClient";

export async function uploadCareerProfile(formData: FormData) {
  const response = await apiRequest("POST", "/api/career-profile", formData);
  return response.json();
}

export async function getCareerRecommendations(userId: number) {
  const response = await apiRequest("GET", `/api/career-recommendations/${userId}`);
  return response.json();
}
