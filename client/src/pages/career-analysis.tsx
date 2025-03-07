import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Briefcase, TrendingUp, Award } from "lucide-react";

interface RecommendedRole {
  title: string;
  industry: string;
  matchPercentage: number;
  requiredSkills: string[];
  growthPotential: string;
  requiredExperience: string;
}

export default function CareerAnalysis() {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["/api/career-recommendations/1"], // TODO: Get user ID from auth
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    console.error("Error loading recommendations:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Recommendations</h2>
            <p className="text-gray-600">Failed to load career recommendations. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recommendedRoles = profile?.recommendations?.recommendedRoles || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Career Recommendations</h1>

        {recommendedRoles.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">No career recommendations available yet. Please try uploading your resume again.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedRoles.map((role, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Briefcase className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="text-xl font-semibold">{role.title}</h3>
                      <p className="text-gray-600">{role.industry}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {role.matchPercentage}% Match
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Key Skills Required</h4>
                      <div className="flex flex-wrap gap-2">
                        {role.requiredSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Growth Potential</h4>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <span>{role.growthPotential}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Required Experience</h4>
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-500" />
                        <span>{role.requiredExperience}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6"
                    onClick={() => setLocation("/growth-plan")}
                  >
                    View Career Path
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}