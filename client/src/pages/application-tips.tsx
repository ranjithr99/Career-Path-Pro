import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCareerRecommendations } from "@/lib/openai";
import { FileText, Users, Github, Briefcase, CheckCircle, XCircle } from "lucide-react";

export default function ApplicationTips() {
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
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Application Tips</h2>
            <p className="text-gray-600">Failed to load application recommendations. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { applicationTips } = profile?.recommendations || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Application Enhancement Tips</h1>

        <Tabs defaultValue="resume" className="space-y-6">
          <TabsList className="grid grid-cols-4 gap-4">
            <TabsTrigger value="resume" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resume
            </TabsTrigger>
            <TabsTrigger value="interview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Interview
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="networking" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Networking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resume">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Resume Optimization</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Key Improvements</h3>
                    <div className="space-y-3">
                      {applicationTips?.resume?.improvements.map((item: string, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <p className="text-gray-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Elements to Remove</h3>
                    <div className="space-y-3">
                      {applicationTips?.resume?.removals.map((item: string, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                          <p className="text-gray-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interview">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Interview Preparation</h2>
                <div className="space-y-6">
                  {applicationTips?.interview?.categories.map((category: any, index: number) => (
                    <div key={index}>
                      <h3 className="font-medium mb-3">{category.name}</h3>
                      <div className="space-y-4">
                        {category.questions.map((question: any, qIndex: number) => (
                          <div key={qIndex} className="border rounded-lg p-4">
                            <p className="font-medium text-gray-800 mb-2">{question.question}</p>
                            <p className="text-gray-600">{question.guidance}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Portfolio Enhancement</h2>
                <div className="space-y-6">
                  {applicationTips?.portfolio?.projects.map((project: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-medium">{project.title}</h3>
                      <p className="text-gray-600 mt-1">{project.description}</p>
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700">Key Technologies</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.technologies.map((tech: string, techIndex: number) => (
                            <span
                              key={techIndex}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="networking">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Networking Strategy</h2>
                <div className="space-y-6">
                  {applicationTips?.networking?.strategies.map((strategy: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">{strategy.title}</h3>
                      <p className="text-gray-600 mb-4">{strategy.description}</p>
                      <div className="space-y-3">
                        {strategy.actionItems.map((item: string, itemIndex: number) => (
                          <div key={itemIndex} className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <p className="text-gray-700">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
