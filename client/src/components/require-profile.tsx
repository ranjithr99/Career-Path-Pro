import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export const withProfileRequired = (WrappedComponent: React.ComponentType) => {
  return function WithProfileRequired(props: any) {
    const [, setLocation] = useLocation();
    
    const { data: profile, isLoading } = useQuery({
      queryKey: ["/api/career-recommendations/1"],
    });

    React.useEffect(() => {
      if (!isLoading && !profile) {
        // No profile found, redirect to home
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

    if (!profile) {
      return null; // Will redirect in useEffect
    }

    return <WrappedComponent {...props} />;
  };
};
