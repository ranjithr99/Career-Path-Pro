import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Github, Briefcase, CheckCircle, XCircle, Loader2 } from "lucide-react";

const defaultTips = {
  resume: {
    improvements: [
      "Highlight quantifiable achievements",
      "Use action verbs to describe responsibilities",
      "Customize resume for each job application"
    ],
    removals: [
      "Outdated or irrelevant experience",
      "Generic objective statements",
      "Personal information beyond contact details"
    ]
  },
  portfolio: {
    projects: [
      {
        title: "Personal Website",
        description: "Create a professional portfolio website showcasing your work",
        technologies: ["React", "TypeScript", "Tailwind CSS"]
      },
      {
        title: "Industry Project",
        description: "Build a project that demonstrates relevant industry skills",
        technologies: ["Node.js", "Express", "PostgreSQL"]
      }
    ]
  },
  networking: {
    strategies: [
      {
        title: "Professional Network Building",
        description: "Expand your professional network through industry events and online platforms",
        actionItems: [
          "Join relevant professional groups",
          "Attend industry conferences",
          "Engage with industry leaders on LinkedIn"
        ]
      },
      {
        title: "Online Presence",
        description: "Maintain an active and professional online presence",
        actionItems: [
          "Regular LinkedIn updates",
          "Share industry insights",
          "Engage in professional discussions"
        ]
      }
    ]
  }
};

export default function ApplicationTips() {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["/api/career-recommendations/1"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading application tips...</p>
        </div>
      </div>
    );
  }

  // Use default tips if no profile data is available
  const tips = profile?.recommendations?.applicationTips || defaultTips;

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
                      {tips.resume.improvements.map((item, index) => (
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
                      {tips.resume.removals.map((item, index) => (
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

          <TabsContent value="portfolio">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Portfolio Enhancement</h2>
                <div className="space-y-6">
                  {tips.portfolio.projects.map((project, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-medium">{project.title}</h3>
                      <p className="text-gray-600 mt-1">{project.description}</p>
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700">Key Technologies</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.technologies.map((tech, techIndex) => (
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
                  {tips.networking.strategies.map((strategy, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">{strategy.title}</h3>
                      <p className="text-gray-600 mb-4">{strategy.description}</p>
                      <div className="space-y-3">
                        {strategy.actionItems.map((item, itemIndex) => (
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