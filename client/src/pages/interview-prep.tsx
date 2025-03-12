import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle 
} from "lucide-react";

interface InterviewQuestion {
  question: string;
  sampleAnswer: string;
  tips: string[];
  commonMistakes: string[];
}

interface InterviewCategory {
  name: string;
  description: string;
  questions: InterviewQuestion[];
}

export default function InterviewPrep() {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["/api/interview-prep/1"], // TODO: Get user ID from auth
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
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Interview Prep</h2>
            <p className="text-gray-600">Failed to load interview preparation data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories: InterviewCategory[] = profile?.interviewPrep?.categories || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Interview Preparation</h1>

        {categories.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">No interview questions available. Please complete your career profile first.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={categories[0]?.name} className="space-y-6">
            <div className="flex justify-center w-full">
              <TabsList className="grid grid-flow-col auto-cols-fr gap-2 w-full max-w-3xl">
                {categories.map((category) => (
                  <TabsTrigger key={category.name} value={category.name}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {categories.map((category) => (
              <TabsContent key={category.name} value={category.name}>
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
                      <p className="text-gray-600 mb-6">{category.description}</p>

                      <div className="space-y-8">
                        {category.questions.map((question, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-start gap-3 mb-4">
                              <MessageCircle className="h-6 w-6 text-blue-500 mt-1" />
                              <div>
                                <h3 className="font-medium text-lg">{question.question}</h3>
                                <p className="text-gray-600 mt-2">{question.sampleAnswer}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Lightbulb className="h-5 w-5 text-green-500" />
                                  <h4 className="font-medium">Key Tips</h4>
                                </div>
                                <ul className="space-y-2">
                                  {question.tips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                                      <span className="text-gray-600">{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                                  <h4 className="font-medium">Common Mistakes</h4>
                                </div>
                                <ul className="space-y-2">
                                  {question.commonMistakes.map((mistake, i) => (
                                    <li key={i} className="flex items-start gap-2 text-gray-600">
                                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-1" />
                                      <span>{mistake}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}