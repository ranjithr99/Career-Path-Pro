import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export const withProfileRequired = (WrappedComponent: React.ComponentType) => {
  return function WithProfileRequired(props: any) {
    const [, setLocation] = useLocation();

    // Get current profile ID from localStorage
    const currentProfileId = localStorage.getItem('currentProfileId') || '1';

    // Check both the profile data and the current session upload status
    const { data: profile, isLoading } = useQuery({
      queryKey: [`/api/career-recommendations/${currentProfileId}`],
      // Disable automatic background refetching
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 0, // Consider data immediately stale
      cacheTime: 0, // Don't cache at all
      // Only fetch if we have a current session upload
      enabled: localStorage.getItem('currentSessionUpload') === 'true',
      // Add timestamp to force fresh request
      queryFn: async () => {
        const timestamp = Date.now();
        const response = await fetch(`/api/career-recommendations/${currentProfileId}?t=${timestamp}`);
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
      }
    });

    React.useEffect(() => {
      const hasUploadedThisSession = localStorage.getItem('currentSessionUpload');

      if (!isLoading && (!profile || !hasUploadedThisSession)) {
        // No profile or no upload in current session, redirect to home
        setLocation('/');
      }
    }, [profile, isLoading, setLocation]);

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

    const hasUploadedThisSession = localStorage.getItem('currentSessionUpload');
    if (!profile || !hasUploadedThisSession) {
      return null; // Will redirect in useEffect
    }

    return <WrappedComponent {...props} />;
  };
};