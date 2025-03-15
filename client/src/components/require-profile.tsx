import React from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export const withProfileRequired = (WrappedComponent: React.ComponentType) => {
  return function WithProfileRequired(props: any) {
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();
    
    const { data: profile, isLoading, refetch } = useQuery({
      queryKey: ["/api/career-recommendations/1"],
      staleTime: 0, // Consider data always stale to ensure fresh data
    });

    // Attempt to refetch data if profile is not found
    React.useEffect(() => {
      if (!isLoading && !profile) {
        console.log("No profile found in withProfileRequired, attempting to refetch");
        
        // Try to refetch the profile data
        const fetchData = async () => {
          try {
            await refetch();
            
            // If still no profile after refetch, redirect to home
            if (!profile) {
              console.log("Still no profile after refetch, redirecting to home");
              setLocation('/');
            }
          } catch (error) {
            console.error("Error refetching profile:", error);
            setLocation('/');
          }
        };
        
        fetchData();
      }
    }, [profile, isLoading, setLocation, refetch]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      );
    }

    if (!profile) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
            <p className="mt-4 text-gray-600">Checking profile data...</p>
          </div>
        </div>
      ); // Show loading while we attempt to refetch in useEffect
    }

    return <WrappedComponent {...props} />;
  };
};
