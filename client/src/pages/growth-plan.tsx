import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "wouter";
import { getCareerRecommendations } from "@/lib/openai";
import { Book, Calendar, Target, Award, ArrowRight } from "lucide-react";

export default function GrowthPlan() {
  const navigate = useNavigate();
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["/api/career-recommendations", 1], // TODO: Get user ID from auth
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Growth Plan</h2>
            <p className="text-gray-600">Failed to load your career growth plan. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { targetRole, skillGaps, learningPath } = profile?.recommendations || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Growth Plan</h1>
          <Button onClick={() => navigate("/application-tips")}>
            View Application Tips
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Target Role Overview */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-semibold">{targetRole?.title}</h2>
                <p className="text-gray-600">{targetRole?.company}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium mb-2">Experience Level</h3>
                <p className="text-gray-600">{targetRole?.experienceLevel}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Salary Range</h3>
                <p className="text-gray-600">{targetRole?.salaryRange}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Industry</h3>
                <p className="text-gray-600">{targetRole?.industry}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skill Gaps Analysis */}
        <h2 className="text-2xl font-semibold mb-4">Skill Gap Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {skillGaps?.map((skill: any, index: number) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">{skill.name}</h3>
                  <span className="text-sm text-gray-500">
                    {skill.currentLevel} → {skill.requiredLevel}
                  </span>
                </div>
                <Progress value={skill.currentLevel * 20} className="mb-2" />
                <p className="text-sm text-gray-600">{skill.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Learning Path */}
        <h2 className="text-2xl font-semibold mb-4">Learning Path</h2>
        <div className="space-y-6">
          {learningPath?.map((item: any, index: number) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {item.type === 'course' ? (
                    <Book className="h-6 w-6 text-blue-500" />
                  ) : item.type === 'certification' ? (
                    <Award className="h-6 w-6 text-green-500" />
                  ) : (
                    <Calendar className="h-6 w-6 text-purple-500" />
                  )}
                  <div className="flex-grow">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-gray-600 mt-1">{item.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {item.duration}
                        </span>
                      </div>
                      {item.link && (
                        <Button variant="outline" size="sm" onClick={() => window.open(item.link, '_blank')}>
                          Start Learning
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
