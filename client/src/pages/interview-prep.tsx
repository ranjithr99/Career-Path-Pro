import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle,
  Loader2 
} from "lucide-react";

export default function InterviewPrep() {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["/api/interview-prep/1"],
    staleTime: 0,
    cacheTime: 0
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading interview preparation content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Interview Prep</h2>
            <p className="text-gray-600">Failed to load interview preparation data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories = profile?.interviewPrep?.categories || [];

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
          <Tabs defaultValue={categories[0]?.name} className="space-y-8">
            <div className="flex justify-center w-full mb-8">
              <TabsList className="bg-white shadow-md rounded-lg p-1 border flex flex-wrap justify-center gap-2 min-h-[48px]">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category.name} 
                    value={category.name}
                    className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                      data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 
                      data-[state=active]:text-white hover:bg-gray-100 data-[state=active]:hover:bg-gradient-to-r 
                      data-[state=active]:hover:from-blue-700 data-[state=active]:hover:to-purple-700"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {categories.map((category) => (
              <TabsContent key={category.name} value={category.name} className="mt-6">
                <Card className="shadow-lg">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-semibold mb-4">{category.name}</h2>
                    <p className="text-gray-600 mb-8">{category.description}</p>

                    <div className="space-y-10">
                      {category.questions.map((question, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-6 py-2">
                          <div className="flex items-start gap-4 mb-6">
                            <MessageCircle className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                            <div>
                              <h3 className="font-medium text-lg text-gray-900">{question.question}</h3>
                              <p className="text-gray-600 mt-3">{question.sampleAnswer}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="h-5 w-5 text-green-500" />
                                <h4 className="font-medium text-gray-900">Key Tips</h4>
                              </div>
                              <ul className="space-y-3">
                                {question.tips.map((tip, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                                    <span className="text-gray-600">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                <h4 className="font-medium text-gray-900">Common Mistakes</h4>
                              </div>
                              <ul className="space-y-3">
                                {question.commonMistakes.map((mistake, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                                    <span className="text-gray-600">{mistake}</span>
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
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}