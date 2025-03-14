import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Github, Linkedin, Lock, CheckCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { uploadCareerProfile } from "@/lib/openai";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const selectedFile = watch("resume");
  const queryClient = useQueryClient();

  // Clear all cached data when component mounts
  React.useEffect(() => {
    queryClient.clear();
    localStorage.removeItem('hasProfile');
    localStorage.removeItem('currentSessionUpload');
  }, [queryClient]);

  const { data: profile } = useQuery({
    queryKey: ["/api/career-recommendations/1"],
  });

  const uploadMutation = useMutation({
    mutationFn: uploadCareerProfile,
    onSuccess: async () => {
      console.log("Resume upload successful");

      toast({
        title: "Success",
        description: "Career profile uploaded successfully",
      });

      // Reset form
      reset();

      // Set profile indicators
      localStorage.setItem('hasProfile', 'true');
      localStorage.setItem('currentSessionUpload', 'true');

      // Wait for data to be processed and then navigate
      try {
        // Invalidate and wait for the query to complete
        await queryClient.invalidateQueries({ queryKey: ["/api/career-recommendations/1"] });
        await new Promise(resolve => setTimeout(resolve, 500));

        // Navigate to jobs page
        setLocation("/jobs");
      } catch (error) {
        console.error("Error after upload:", error);
        toast({
          title: "Navigation Error",
          description: "Please try refreshing the page",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload career profile",
        variant: "destructive",
      });
    }
  });

  const hasProfile = !!profile && localStorage.getItem('currentSessionUpload') === 'true';

  const features = [
    {
      title: "AI Career Analysis",
      description: "Get personalized career path recommendations based on your skills and experience"
    },
    {
      title: "Mentorship Simulation",
      description: "Industry-specific career advice powered by advanced reasoning models"
    },
    {
      title: "Interview Preparation",
      description: "Access AI-generated interview questions tailored to your target roles"
    },
    {
      title: "Application Tips",
      description: "Receive customized advice for resume optimization and application strategies"
    }
  ];

  const onSubmit = async (data: any) => {
    try {
      if (!data.resume?.[0]) {
        toast({
          title: "Error",
          description: "Please select a resume file",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("resume", data.resume[0]);
      formData.append("linkedinUrl", data.linkedinUrl || '');
      formData.append("githubUsername", data.githubUsername || '');

      await uploadMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload career profile",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto pt-16 px-4">
        <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text transform hover:scale-105 transition-transform duration-200">
          CareerPath Pro
        </h1>
        <p className="text-center text-gray-600 mb-8">
          AI-Powered Career Pathway Advisor
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {features.map((feature, index) => (
            <Card key={index} className={`transition-all min-h-[180px] ${hasProfile ? 'bg-white' : 'bg-gray-50'}`}>
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-start gap-3 flex-grow">
                  {hasProfile ? (
                    <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  ) : (
                    <Lock className="h-6 w-6 text-gray-400 mt-1" />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Resume (PDF or TXT)
                </label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Input
                      type="file"
                      accept=".pdf,.txt"
                      {...register("resume", { required: true })}
                      className="mt-4"
                    />
                    {selectedFile?.[0] && (
                      <p className="text-sm text-gray-600 mt-2">
                        Selected: {selectedFile[0].name}
                      </p>
                    )}
                  </div>
                </div>
                {errors.resume && (
                  <p className="text-red-500 text-sm mt-1">Resume is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  LinkedIn Profile URL (Optional)
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                    className="pl-10"
                    {...register("linkedinUrl")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  GitHub Username (Optional)
                </label>
                <div className="relative">
                  <Github className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="your-username"
                    className="pl-10"
                    {...register("githubUsername")}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full hover:bg-blue-700 hover:text-white transition-colors duration-300"
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  hasProfile ? "Update Career Profile" : "Start Career Analysis"
                )}
              </Button>

              {!hasProfile && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  Upload your resume to unlock AI-powered career insights and personalized guidance
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}