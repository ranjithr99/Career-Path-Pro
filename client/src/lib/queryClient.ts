import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = await res.text();
      throw new Error(`${res.status}: ${text || res.statusText}`);
    } catch (error) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`);
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Request failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`Query: ${url}`);
    
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Unauthorized access to ${url}, returning null`);
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`Query failed: ${url}`, error);
      throw error;
    }
  };

// Utility function to refresh all profile-related data
export const refreshAllProfileData = async (queryClient: QueryClient, userId = 1) => {
  console.log("Refreshing all profile-related data");
  
  // Clear all existing queries
  queryClient.clear();
  
  try {
    // Fetch the career recommendations first
    await queryClient.fetchQuery({ 
      queryKey: [`/api/career-recommendations/${userId}`]
    });
    
    // Then fetch all other data in parallel
    await Promise.allSettled([
      queryClient.fetchQuery({ 
        queryKey: [`/api/job-postings/${userId}`]
      }),
      queryClient.fetchQuery({ 
        queryKey: [`/api/portfolio-suggestions/${userId}`]
      }),
      queryClient.fetchQuery({ 
        queryKey: [`/api/resume-feedback/${userId}`]
      }),
      queryClient.fetchQuery({ 
        queryKey: [`/api/linkedin-events/${userId}`]
      }),
      queryClient.fetchQuery({ 
        queryKey: [`/api/interview-prep/${userId}`]
      })
    ]);
    
    console.log("Successfully refreshed all profile data");
    return true;
  } catch (error) {
    console.error("Error refreshing profile data:", error);
    return false;
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds - shorter stale time to ensure fresher data
      retry: 2,
      retryDelay: 1000,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
