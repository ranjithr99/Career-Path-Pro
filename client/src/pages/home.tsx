import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Github, Linkedin } from "lucide-react";
import { useLocation } from "wouter";
import { uploadCareerProfile } from "@/lib/openai";

export default function Home() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const selectedFile = watch("resume");

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

      console.log("Uploading file:", data.resume[0].name);
      const formData = new FormData();
      formData.append("resume", data.resume[0]);
      formData.append("linkedinUrl", data.linkedinUrl || '');
      formData.append("githubUsername", data.githubUsername || '');

      await uploadCareerProfile(formData);
      toast({
        title: "Success",
        description: "Career profile uploaded successfully",
      });
      setLocation("/career-analysis");
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
        <h1 className="text-4xl font-bold text-center mb-8">
          AI-Powered Career Pathway Advisor
        </h1>

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

              <Button type="submit" className="w-full">
                Start Career Analysis
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}