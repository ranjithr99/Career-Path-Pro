import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Github, Briefcase, CheckCircle, XCircle, Loader2, Calendar, Linkedin, Users, TrendingUp, PenTool } from "lucide-react";

interface LinkedInEvent {
  title: string;
  date: string;
  url: string;
  type: string;
}

export default function ApplicationTips() {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["/api/career-recommendations/1"],
  });

  const { data: events } = useQuery({
    queryKey: ["/api/linkedin-events/1"],
    enabled: !!profile, // Only fetch if profile exists
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

  // Generate personalized resume recommendations based on profile
  const generateResumeRecommendations = () => {
    if (!profile?.resumeText) return defaultTips.resume;

    const resumeText = profile.resumeText;
    const recommendations = {
      improvements: [] as string[],
      removals: [] as string[],
      skillsGaps: [] as string[]
    };

    // Analyze experience descriptions
    const experienceMatches = resumeText.match(/(?<=\n)(.*?experience.*?\n)((?:.*?\n)*?)(?=\n|$)/gi);
    if (experienceMatches) {
      const experienceText = experienceMatches.join('\n');
      const bulletPoints = experienceText.match(/•\s*[^•\n]+|^\s*-\s*[^-\n]+/gm) || [];

      // Check for weak bullet points (starting with generic verbs)
      const weakBullets = bulletPoints.filter(bullet => 
        bullet.match(/•\s*(worked|helped|assisted|responsible|participated)/i)
      );
      if (weakBullets.length > 0) {
        recommendations.improvements.push(
          `Replace weak action verbs with stronger alternatives. For example:\n` +
          weakBullets.map(bullet => 
            `• Instead of "${bullet.trim()}", try using "Led", "Spearheaded", "Implemented", or "Orchestrated"`
          ).join('\n')
        );
      }

      // Check for quantifiable achievements
      const nonQuantifiedBullets = bulletPoints.filter(bullet => 
        !bullet.match(/\d+%|\$\d+|\d+ million|\d+ users|\d+ team|\d+ project|\d+ month/gi)
      );
      if (nonQuantifiedBullets.length > 0) {
        recommendations.improvements.push(
          `Add specific metrics to these achievements:\n` +
          nonQuantifiedBullets.slice(0, 3).map(bullet => 
            `• "${bullet.trim()}" - Include numbers, percentages, or timeframes`
          ).join('\n')
        );
      }

      // Check for technical detail depth
      if (!experienceText.match(/using|leveraging|implementing|developing with/gi)) {
        recommendations.improvements.push(
          "Add technical implementation details to your experience. For example:\n" +
          "• Specify tools and technologies used in each project\n" +
          "• Mention specific methodologies or frameworks employed"
        );
      }
    }

    // Analyze skills alignment with target role
    if (profile.targetRole && profile.skills) {
      const targetRoleSkills = profile.recommendations?.requiredSkills || [];
      const missingSkills = targetRoleSkills.filter(
        skill => !profile.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      );

      if (missingSkills.length > 0) {
        const relevantSkills = missingSkills.slice(0, 3);
        recommendations.skillsGaps.push(
          `Your target role of ${profile.targetRole} typically requires: ${relevantSkills.join(', ')}. Consider:\n` +
          `• Taking online courses in ${relevantSkills[0]}\n` +
          `• Working on side projects using ${relevantSkills[1]}\n` +
          `• Getting certified in ${relevantSkills[2]}`
        );
      }
    }

    // Check for industry-specific keywords
    if (profile.targetRole) {
      const industryKeywords = {
        'Software Engineer': ['architecture', 'scalable', 'optimization', 'system design'],
        'Data Scientist': ['machine learning', 'statistical analysis', 'data visualization'],
        'Product Manager': ['stakeholder', 'roadmap', 'user research', 'metrics']
      };

      const roleKeywords = industryKeywords[profile.targetRole as keyof typeof industryKeywords] || [];
      const missingKeywords = roleKeywords.filter(keyword => 
        !resumeText.toLowerCase().includes(keyword)
      );

      if (missingKeywords.length > 0) {
        recommendations.improvements.push(
          `Incorporate these industry-specific keywords to strengthen your profile:\n` +
          missingKeywords.map(keyword => `• Add examples of your experience with "${keyword}"`).join('\n')
        );
      }
    }

    // Check for formatting and structure
    const sections = resumeText.match(/^[A-Z][A-Za-z\s]+:?$/gm) || [];
    const expectedSections = ['Experience', 'Education', 'Skills', 'Projects'];
    const missingSections = expectedSections.filter(section => 
      !sections.some(s => s.toLowerCase().includes(section.toLowerCase()))
    );

    if (missingSections.length > 0) {
      recommendations.improvements.push(
        `Add these missing sections to follow standard resume format:\n` +
        missingSections.map(section => `• ${section}`).join('\n')
      );
    }

    // Check for outdated or irrelevant information
    const years = resumeText.match(/20[0-9]{2}/g) || [];
    const oldestYear = Math.min(...years.map(y => parseInt(y)));
    if (oldestYear < 2015) {
      recommendations.removals.push(
        `Your resume includes experience from ${oldestYear}. Consider:\n` +
        `• Removing positions older than 8-10 years unless they're highly relevant\n` +
        `• Focusing on recent achievements that demonstrate current skills\n` +
        `• Summarizing older experience in a brief "Additional Experience" section`
      );
    }

    return {
      improvements: recommendations.improvements,
      removals: recommendations.removals,
      skillsGaps: recommendations.skillsGaps
    };
  };

  // Generate personalized networking recommendations
  const generateNetworkingRecommendations = () => {
    const networkingTips = {
      strategies: [
        {
          title: "Professional Network Building",
          description: "Tailored networking opportunities based on your profile",
          sections: [
            {
              title: "Upcoming Events",
              icon: Calendar,
              items: events?.upcoming?.map((event: LinkedInEvent) =>
                `Attend "${event.title}" ${event.type} on ${event.date}`
              ) || []
            },
            {
              title: "Recommended Groups",
              icon: Users,
              items: events?.groups?.map((group: any) =>
                `Join "${group.name}" - ${group.description} (${group.memberCount} members)`
              ) || []
            },
            {
              title: "Industry Influencers",
              icon: Linkedin,
              items: events?.influencers?.map((influencer: any) =>
                `Follow ${influencer.name}, ${influencer.title} - Expert in ${influencer.expertise.join(", ")}`
              ) || []
            }
          ]
        },
        {
          title: "Content Strategy",
          description: "Strategic content sharing to build your professional brand",
          sections: [
            {
              title: "Trending Topics",
              icon: TrendingUp,
              items: events?.trendingTopics?.map((topic: any) =>
                `${topic.topic}: ${topic.suggestedInteraction}`
              ) || []
            },
            {
              title: "Content Ideas",
              icon: PenTool,
              items: events?.contentIdeas?.map((idea: any) =>
                `Share insights on "${idea.title}" - ${idea.description}`
              ) || []
            }
          ]
        }
      ]
    };

    return networkingTips;
  };

  // Use personalized tips if available, otherwise fall back to defaults
  const resumeTips = profile ? generateResumeRecommendations() : defaultTips.resume;
  const networkingTips = profile ? generateNetworkingRecommendations() : defaultTips.networking;
  const portfolioTips = defaultTips.portfolio; // Keep portfolio tips as is

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Application Enhancement Tips</h1>

        <Tabs defaultValue="resume" className="space-y-6">
          <div className="flex justify-center w-full">
            <TabsList className="grid grid-cols-3 gap-4 min-w-[400px]">
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
          </div>

          <TabsContent value="resume">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Resume Optimization</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Personalized Improvements</h3>
                    <div className="space-y-3">
                      {resumeTips.improvements.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <p className="text-gray-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {resumeTips.skillsGaps && resumeTips.skillsGaps.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Skills Enhancement</h3>
                      <div className="space-y-3">
                        {resumeTips.skillsGaps.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                            <p className="text-gray-700">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium mb-3">Suggested Removals</h3>
                    <div className="space-y-3">
                      {resumeTips.removals.map((item, index) => (
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
                  {portfolioTips.projects.map((project, index) => (
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
                  {networkingTips.strategies.map((strategy, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {index === 0 ? (
                          <Users className="h-5 w-5 text-blue-500" />
                        ) : (
                          <PenTool className="h-5 w-5 text-blue-500" />
                        )}
                        <h3 className="font-medium">{strategy.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-4">{strategy.description}</p>

                      {strategy.sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <section.icon className="h-4 w-4 text-gray-600" />
                            <h4 className="font-medium text-sm">{section.title}</h4>
                          </div>
                          <div className="space-y-3 pl-6">
                            {section.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                                <p className="text-gray-700 text-sm">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
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