// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
import { apiRequest } from "./queryClient";

export async function uploadCareerProfile(formData: FormData) {
  console.log("Starting career profile upload...");
  
  try {
    const response = await fetch("/api/career-profile", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      console.error("Career profile upload failed:", {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.details || errorData.message || `Upload failed with status ${response.status}`);
    }

    console.log("Career profile upload successful");
    return response.json();
  } catch (error) {
    console.error("Exception during career profile upload:", error);
    throw error;
  }
}

export async function getCareerRecommendations(userId: number) {
  console.log(`Fetching career recommendations for user ${userId}`);
  try {
    const response = await apiRequest("GET", `/api/career-recommendations/${userId}`);
    return response.json();
  } catch (error) {
    console.error("Failed to fetch career recommendations:", error);
    throw error;
  }
}