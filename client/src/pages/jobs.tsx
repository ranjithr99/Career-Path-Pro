import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Briefcase,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  Globe,
  Building,
  DollarSign
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RecommendedRole {
  title: string;
  industry: string;
  matchPercentage: number;
  requiredSkills: string[];
  growthPotential: string;
  requiredExperience: string;
}

interface JobPosting {
  title: string;
  company: string;
  location: string;
  type: "remote" | "hybrid" | "onsite";
  description: string;
  requirements: string[];
  salary: string;
  postedDate: string;
  applicationUrl: string;
  skillMatch: number;
}

export default function Jobs() {
  const [selectedRole, setSelectedRole] = useState<RecommendedRole | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/career-recommendations/1"],
  });

  const { data: jobPostings, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/job-postings/1"],
    enabled: !!profile,
  });

  if (profileLoading || jobsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Finding the best opportunities for you...</p>
        </div>
      </div>
    );
  }

  const recommendedRoles = profile?.recommendations?.recommendedRoles || [];
  const availableJobs = jobPostings?.jobPostings || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Recommended Jobs</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {recommendedRoles.map((role, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Briefcase className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="text-xl font-semibold">{role.title}</h3>
                    <p className="text-gray-600">{role.industry}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Match Score</span>
                      <span className="text-sm font-medium">{role.matchPercentage}%</span>
                    </div>
                    <Progress value={role.matchPercentage} className="h-2" />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Required Skills</h4>
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

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span>{role.growthPotential}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span>{role.requiredExperience}</span>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full mt-4"
                        onClick={() => setSelectedRole(role)}
                      >
                        View Career Path
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Career Path: {role.title}</DialogTitle>
                        <DialogDescription>
                          Your journey to becoming a successful {role.title}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-6">
                        <div className="space-y-8">
                          {
                            [
                              {
                                title: "Entry Level Position",
                                timeframe: "0-2 years",
                                description: "Build foundational experience and skills",
                                skills: ["Technical Skills", "Communication", "Problem Solving"],
                                milestones: [
                                  "Complete key certifications",
                                  "Contribute to major projects",
                                  "Build professional network"
                                ]
                              },
                              {
                                title: "Mid-Level Position",
                                timeframe: "2-5 years",
                                description: "Take on more responsibility and leadership",
                                skills: ["Project Management", "Team Leadership", "Strategic Planning"],
                                milestones: [
                                  "Lead team projects",
                                  "Mentor junior team members",
                                  "Develop industry expertise"
                                ]
                              },
                              {
                                title: "Senior Position",
                                timeframe: "5+ years",
                                description: "Strategic leadership and vision",
                                skills: ["Leadership", "Strategy", "Innovation"],
                                milestones: [
                                  "Drive organizational change",
                                  "Set department strategy",
                                  "Build and lead teams"
                                ]
                              }
                            ].map((step, index) => (
                              <div key={index} className="relative">
                                {index < 2 && (
                                  <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-blue-200" />
                                )}
                                <div className="flex gap-4">
                                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <span className="text-blue-600 font-semibold">{index + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                      {step.title}
                                      <span className="text-sm text-gray-500">({step.timeframe})</span>
                                    </h3>
                                    <p className="text-gray-600 mt-1">{step.description}</p>

                                    <div className="mt-4 space-y-4">
                                      <div>
                                        <h4 className="font-medium text-sm text-gray-700 mb-2">Key Skills to Develop</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {step.skills.map((skill, i) => (
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
                                        <h4 className="font-medium text-sm text-gray-700 mb-2">Key Milestones</h4>
                                        <ul className="space-y-2">
                                          {step.milestones.map((milestone, i) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-600">
                                              <ChevronRight className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                              <span>{milestone}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-6">Available Positions</h2>
        <div className="space-y-6">
          {availableJobs.map((job, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Building className="h-8 w-8 text-blue-500 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold">{job.title}</h3>
                      <p className="text-gray-600">{job.company}</p>

                      <div className="flex flex-wrap gap-4 mt-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Globe className="h-4 w-4" />
                          <span>{job.type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span>{job.salary}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {job.skillMatch}% Match
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Posted {job.postedDate}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-gray-700">{job.description}</p>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.map((req, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                    onClick={() => window.open(job.applicationUrl, '_blank')}
                  >
                    Apply Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}