import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Github, Briefcase, CheckCircle, XCircle, Loader2, 
  Calendar, Linkedin, Users, TrendingUp, PenTool, Code, Clock,
  BookOpen, Trophy, AlertTriangle, Star
} from "lucide-react";
import { withProfileRequired } from '@/components/require-profile';

// ... (keep existing interfaces)

interface ResumeFeedback {
  overview: {
    strengths: string[];
    improvements: string[];
  };
  sections: {
    summary: { feedback: string; suggestions: string[] };
    experience: { feedback: string; suggestions: string[] };
    skills: { feedback: string; suggestions: string[] };
    education: { feedback: string; suggestions: string[] };
  };
  formatting: {
    issues: string[];
    recommendations: string[];
  };
  impactScore: number;
}

export default withProfileRequired(ApplicationTips);

function ApplicationTips() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/career-recommendations/1"],
  });

  const { data: resumeFeedback, isLoading: feedbackLoading, error: feedbackError, refetch: refetchFeedback } = useQuery<ResumeFeedback>({
    queryKey: ["/api/resume-feedback/1"],
    enabled: !!profile,
    retry: 3,
    retryDelay: 1000,
  });

  const { data: events, isLoading: eventsLoading, error: eventsError, refetch: refetchEvents } = useQuery<NetworkingResponse>({
    queryKey: ["/api/linkedin-events/1"],
    enabled: !!profile,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 3, // Retry failed requests 3 times
  });

  const { data: portfolioSuggestions, isLoading: suggestionsLoading, error: suggestionsError, refetch: refetchPortfolio } = useQuery({
    queryKey: ["/api/portfolio-suggestions/1"],
    enabled: !!profile,
    retry: 3,
    retryDelay: 1000,
  });

  // Attempt to refetch data if needed
  React.useEffect(() => {
    if (profile && !profileLoading) {
      // If we have a profile but any of the dependent queries failed, try to refetch them
      if (feedbackError) {
        console.log("Resume feedback failed, attempting to refetch");
        refetchFeedback();
      }
      
      if (eventsError) {
        console.log("LinkedIn events failed, attempting to refetch");
        refetchEvents();
      }
      
      if (suggestionsError) {
        console.log("Portfolio suggestions failed, attempting to refetch");
        refetchPortfolio();
      }
    }
  }, [profile, profileLoading, feedbackError, eventsError, suggestionsError, refetchFeedback, refetchEvents, refetchPortfolio]);

  const NetworkingSectionLoader = () => (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
        <p className="mt-4 text-gray-600">Loading networking suggestions...</p>
      </div>
    </div>
  );

  const NetworkingErrorState = () => (
    <div className="text-center py-8">
      <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
      <p className="mt-4 text-gray-600">Unable to load networking suggestions. Please try again later.</p>
    </div>
  );

  const NetworkingContent = () => {
    if (eventsLoading) return <NetworkingSectionLoader />;
    if (eventsError || !events) return <NetworkingErrorState />;

    return (
      <div className="space-y-6">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">Professional Network Building</h3>
          </div>
          <p className="text-gray-600 mb-4">Tailored networking opportunities based on your profile</p>

          {/* Upcoming Events */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <h4 className="font-medium text-sm">Upcoming Events</h4>
            </div>
            <div className="space-y-3 pl-6">
              {events.upcoming?.map((event, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  <p className="text-gray-700 text-sm">
                    {event.title} - {event.type} on {event.date}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Groups */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-gray-600" />
              <h4 className="font-medium text-sm">Recommended Groups</h4>
            </div>
            <div className="space-y-3 pl-6">
              {events.groups?.map((group, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  <p className="text-gray-700 text-sm">
                    {group.name} - {group.description} ({group.memberCount} members)
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Influencers */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Linkedin className="h-4 w-4 text-gray-600" />
              <h4 className="font-medium text-sm">Industry Influencers</h4>
            </div>
            <div className="space-y-3 pl-6">
              {events.influencers?.map((influencer, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  <p className="text-gray-700 text-sm">
                    Follow {influencer.name}, {influencer.title} - Expert in {influencer.expertise.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Strategy */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <PenTool className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">Content Strategy</h3>
          </div>
          <p className="text-gray-600 mb-4">Strategic content sharing to build your professional brand</p>

          {/* Trending Topics */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <h4 className="font-medium text-sm">Trending Topics</h4>
            </div>
            <div className="space-y-3 pl-6">
              {events.trendingTopics?.map((topic, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  <p className="text-gray-700 text-sm">
                    {topic.topic}: {topic.suggestedInteraction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Content Ideas */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <PenTool className="h-4 w-4 text-gray-600" />
              <h4 className="font-medium text-sm">Content Ideas</h4>
            </div>
            <div className="space-y-3 pl-6">
              {events.contentIdeas?.map((idea, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  <p className="text-gray-700 text-sm">
                    {idea.title} - {idea.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (profileLoading || suggestionsLoading || feedbackLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading application tips...</p>
        </div>
      </div>
    );
  }

  const generateResumeRecommendations = () => {
    if (!profile?.resumeText) return defaultTips.resume;

    const resumeText = profile.resumeText;
    const recommendations = {
      improvements: [] as string[],
      removals: [] as string[]
    };

    // Check for quantifiable achievements
    if (!resumeText.match(/increased|decreased|improved|reduced|achieved|delivered|generated/gi)) {
      recommendations.improvements.push("Add more quantifiable achievements - your experience seems to lack specific metrics");
    }

    // Check for technical skills alignment
    if (profile.targetRole?.includes("Data") && !resumeText.toLowerCase().includes("sql")) {
      recommendations.improvements.push("Include SQL skills as it's crucial for your target data roles");
    }

    // Check for action verbs
    if (!resumeText.match(/implemented|developed|created|managed|led|coordinated/gi)) {
      recommendations.improvements.push("Use more powerful action verbs to describe your achievements");
    }

    // Check for outdated information
    const years = resumeText.match(/20[0-9]{2}/g) || [];
    const oldestYear = Math.min(...years.map(y => parseInt(y)));
    if (oldestYear < 2015) {
      recommendations.removals.push(`Consider removing experience older than 2015 unless highly relevant`);
    }

    // Add default recommendations if needed
    if (recommendations.improvements.length < 3) {
      recommendations.improvements.push(...defaultTips.resume.improvements);
    }
    if (recommendations.removals.length < 2) {
      recommendations.removals.push(...defaultTips.resume.removals);
    }

    return recommendations;
  };

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

  const resumeTips = profile ? generateResumeRecommendations() : defaultTips.resume;
  const networkingTips = profile ? generateNetworkingRecommendations() : defaultTips.networking;

  const ResumeFeedbackSection = () => {
    if (feedbackLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
            <p className="mt-4 text-gray-600">Analyzing your resume...</p>
          </div>
        </div>
      );
    }

    if (feedbackError || !resumeFeedback) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
          <p className="mt-4 text-gray-600">Unable to load resume feedback. Please try again later.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Impact Score */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500" />
              Resume Impact Score
            </h3>
            <span className="text-lg font-semibold text-blue-600">{resumeFeedback.impactScore}/100</span>
          </div>
          <Progress value={resumeFeedback.impactScore} className="h-2" />
        </div>

        {/* Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {resumeFeedback.overview.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {resumeFeedback.overview.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-1" />
                  <span className="text-gray-700">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detailed Section Feedback */}
        <div className="space-y-6">
          {Object.entries(resumeFeedback.sections).map(([section, feedback]) => (
            <div key={section} className="border rounded-lg p-4">
              <h3 className="font-medium capitalize mb-3">{section} Section</h3>
              <p className="text-gray-700 mb-3">{feedback.feedback}</p>
              <div className="space-y-2">
                {feedback.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-1" />
                    <span className="text-gray-700">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Formatting Guidelines */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">Formatting & Structure</h3>
          {resumeFeedback.formatting.issues.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Issues to Address</h4>
              <ul className="space-y-2">
                {resumeFeedback.formatting.issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-1" />
                    <span className="text-gray-700">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
            <ul className="space-y-2">
              {resumeFeedback.formatting.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

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
                <h2 className="text-xl font-semibold mb-4">Resume Analysis</h2>
                <ResumeFeedbackSection />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Portfolio Projects</h2>
                <p className="text-gray-600 mb-6">
                  Personalized project suggestions based on your profile and career goals
                </p>

                <div className="space-y-8">
                  {portfolioSuggestions?.suggestedProjects.map((project, index) => (
                    <div key={index} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium">{project.title}</h3>
                          <p className="text-gray-600 mt-1">{project.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-500">{project.timeEstimate}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-2">
                            <Code className="h-4 w-4 text-blue-500" />
                            Technologies
                          </h4>
                          <div className="flex flex-wrap gap-2">
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

                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4 text-green-500" />
                            Learning Outcomes
                          </h4>
                          <ul className="space-y-1">
                            {project.learningOutcomes.map((outcome, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                                <span>{outcome}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          Implementation Guide
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Key Features</h5>
                            <ul className="space-y-1">
                              {project.implementation.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                  <CheckCircle className="h-4 w-4 text-blue-500 mt-1" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Potential Challenges</h5>
                            <ul className="space-y-1">
                              {project.implementation.challenges.map((challenge, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-1" />
                                  <span>{challenge}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {portfolioSuggestions?.skillGaps.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Recommended Skill Improvements</h3>
                    <div className="space-y-3">
                      {portfolioSuggestions.skillGaps.map((gap, index) => (
                        <div key={index} className="flex items-start gap-3 text-gray-600">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-700">{gap.skill}</p>
                            <p className="text-sm">Practice with: {gap.projectType}</p>
                            <p className="text-sm text-amber-600">Importance: {gap.importance}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="networking">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Networking Strategy</h2>
                <NetworkingContent />
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