import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getCareerRecommendations } from "@/lib/openai";
import { Briefcase, TrendingUp, Award } from "lucide-react";

interface RecommendedRole {
  title: string;
  industry: string;
  matchPercentage: number;
  requiredSkills: string[];
  growthPotential: string;
  requiredExperience: string;
}

interface CareerRecommendations {
  recommendedRoles: RecommendedRole[];
}

export default function CareerAnalysis() {
  const [, setLocation] = useLocation();
  const { data: recommendations, isLoading } = useQuery<CareerRecommendations>({
    queryKey: ["/api/career-recommendations", 1], // TODO: Get user ID from auth
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Career Recommendations</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations?.recommendedRoles?.map((role, index) => (
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
      </div>
    </div>
  );
}