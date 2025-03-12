import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import { insertCareerProfileSchema } from "@shared/schema";
import axios from "axios";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Initialize Google AI with Gemini model
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ],
});

// TheirStack API configuration
const THEIRSTACK_API_URL = "https://api.theirstack.com/v1/jobs/search";

// Verify API key is loaded
if (!process.env.THEIRSTACK_API_KEY) {
  console.error(
    "THEIRSTACK_API_KEY is not set. Job search functionality will not work.",
  );
}

async function fetchJobPostings(profile: any) {
  console.log(`Fetching jobs`);
  const startTime = Date.now();

  try {
    // Extract job titles from recommendations (top 2 only since we only need 2 roles now)
    const recommendedRoles = profile.recommendations?.recommendedRoles?.slice(0, 2) || [];
    if (!recommendedRoles.length) {
      console.log('No recommended roles found, using default');
      recommendedRoles.push({ title: "Software Engineer" });
    }
    console.log(`Using recommended roles:`, recommendedRoles.map((r: any) => r.title));

    // Make separate API calls for each role
    const jobsByRole = await Promise.all(recommendedRoles.map(async (role: any, index: number) => {
      const limit = index === 0 ? 2 : 1; // 2 jobs for first role, 1 for second

      try {
        console.log(`Fetching jobs for role: ${role.title}`);
        const response = await axios.post(THEIRSTACK_API_URL, {
          page: 0,
          limit,
          job_title_or: [role.title],
          posted_at_max_age_days: 7,
          company_country_code_or: ["US"],
          include_total_results: true,
        }, {
          headers: {
            Authorization: `Bearer ${process.env.THEIRSTACK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });

        return response.data.data.map((job: any) => {
          // Calculate match score based on role and profile
          let matchScore = 0;
          const jobTitleLower = job.job_title.toLowerCase();
          const roleTitleLower = role.title.toLowerCase();

          // Main role match (60% weight)
          if (jobTitleLower.includes(roleTitleLower)) {
            matchScore += 60;
          }

          // Skill match (40% weight)
          const userSkills = new Set(profile.skills?.map((s: string) => s.toLowerCase()) || []);
          const jobSkills = new Set((job.technology_slugs || []).map((s: string) => s.toLowerCase()));
          const totalSkills = jobSkills.size || 1;
          let matchedSkills = 0;

          jobSkills.forEach((skill: string) => {
            if (userSkills.has(skill)) {
              matchedSkills++;
            }
          });

          const skillScore = Math.min(40, Math.round((matchedSkills / totalSkills) * 40));
          matchScore += skillScore;

          // Get requirements based on role
          const requirements = getRequirementsForRole(jobTitleLower);

          return {
            title: job.job_title,
            company: job.company_object.name,
            companyLogo: job.company_object.logo,
            location: job.location || job.short_location || 'Remote',
            type: job.remote ? 'remote' : (job.hybrid ? 'hybrid' : 'onsite'),
            description: job.description,
            requirements,
            salary: `${job.min_annual_salary_usd ? `$${job.min_annual_salary_usd/1000}k` : ''} ${job.max_annual_salary_usd ? `- $${job.max_annual_salary_usd/1000}k` : ''}`,
            postedDate: job.date_posted,
            applicationUrl: job.url,
            skillMatch: matchScore,
            roleMatch: role.title
          };
        });
      } catch (error) {
        console.error(`Error fetching jobs for role ${role.title}:`, error);
        return [];
      }
    }));

    // Combine all jobs
    const allJobs = jobsByRole.flat();

    const endTime = Date.now();
    console.log(`TheirStack API calls completed in ${endTime - startTime}ms`);

    return {
      jobs: allJobs,
      totalResults: allJobs.length
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("TheirStack API error:", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
        duration: Date.now() - startTime,
      });

      if (error.code === "ECONNABORTED") {
        throw new Error("TheirStack API request timed out");
      }
    } else {
      console.error("Unexpected error while fetching jobs:", error);
    }
    return { jobs: [], totalResults: 0 };
  }
}

// Helper function to get requirements based on role
function getRequirementsForRole(jobTitle: string): string[] {
  if (jobTitle.includes('data engineer')) {
    return ['Python', 'SQL', 'ETL', 'Data Warehousing', 'Big Data'];
  } else if (jobTitle.includes('software engineer')) {
    return ['JavaScript', 'Python', 'Full Stack', 'APIs', 'Databases'];
  } else if (jobTitle.includes('cloud engineer')) {
    return ['AWS', 'Azure', 'Kubernetes', 'Docker', 'Infrastructure'];
  } else if (jobTitle.includes('frontend')) {
    return ['React', 'TypeScript', 'HTML/CSS', 'UI/UX', 'APIs'];
  } else if (jobTitle.includes('backend')) {
    return ['Node.js', 'Python', 'Databases', 'APIs', 'System Design'];
  }
  return ['Programming', 'Problem Solving', 'Communication', 'Version Control'];
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/job-postings/:userId", async (req, res) => {
    const startTime = Date.now();
    try {
      const userId = parseInt(req.params.userId);

      console.log(`Processing job postings request for user ${userId}`, {
        hasApiKey: !!process.env.THEIRSTACK_API_KEY,
      });

      const profile = await storage.getCareerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const result = await fetchJobPostings(profile);

      console.log(
        `Job postings request completed in ${Date.now() - startTime}ms`,
        {
          totalJobs: result.jobs.length,
          totalResults: result.totalResults,
        },
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching job postings:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Job postings request failed after ${Date.now() - startTime}ms:`,
        errorMessage,
      );

      res.status(500).json({
        message: "Failed to fetch job postings",
        details: errorMessage,
      });
    }
  });

  app.post("/api/career-profile", upload.single("resume"), async (req, res) => {
    try {
      console.log("Received career profile request", {
        file: req.file ? "present" : "missing",
        body: req.body,
      });

      const resumeFile = req.file;
      const { linkedinUrl, githubUsername } = req.body;

      if (!resumeFile) {
        console.log("Resume file missing in request");
        return res.status(400).json({ message: "Resume file is required" });
      }

      // Extract text from resume
      const resumeText = resumeFile.buffer.toString("utf-8");
      console.log("Successfully extracted resume text", {
        length: resumeText.length,
      });

      // Analyze resume using Gemini
      const prompt = `Analyze the following resume and extract skills, experience, and education. Return only a JSON object with the following structure, nothing else: { "skills": string[], "experience": { "title": string, "company": string, "duration": string, "description": string[] }[], "education": { "degree": string, "institution": string, "year": string }[] }
Resume text:
${resumeText}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
      }

      const parsedAnalysis = JSON.parse(jsonMatch[0]);
      console.log("Successfully analyzed resume with Gemini");

      // Create career profile
      const profile = await storage.createCareerProfile({
        userId: 1, // TODO: Get from auth
        resumeText,
        linkedinUrl,
        githubUsername,
        skills: parsedAnalysis.skills,
        experience: parsedAnalysis.experience,
        education: parsedAnalysis.education,
      });

      console.log("Successfully created career profile", {
        profileId: profile.id,
      });
      res.json(profile);
    } catch (error) {
      console.error("Error processing career profile:", error);
      res.status(500).json({
        message: "Failed to process career profile",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/career-recommendations/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profile = await storage.getCareerProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Generate career recommendations using Gemini
      const prompt = `Based on the following career profile, suggest career paths and recommendations. Return only a JSON object with the following structure, nothing else: { "recommendedRoles": [ { "title": string, "industry": string, "matchPercentage": number, "requiredSkills": string[], "growthPotential": string, "requiredExperience": string } ] }
Profile:
${JSON.stringify(profile, null, 2)}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
      }

      const parsedRecommendations = JSON.parse(jsonMatch[0]);

      // Update profile with recommendations
      const updatedProfile = await storage.updateCareerProfile(profile.id, {
        recommendations: parsedRecommendations,
      });

      res.json(updatedProfile);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({
        message: "Failed to generate recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/interview-prep/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profile = await storage.getCareerProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Generate interview prep using Gemini
      const prompt = `As an expert technical interviewer, analyze this career profile and generate comprehensive interview preparation materials focused on their target roles and experience level. 

Return only a JSON object with this exact structure, nothing else:
{
  "categories": [
    {
      "name": string, // e.g. "Technical Skills", "System Design", "Behavioral Questions"
      "description": string,
      "questions": [
        {
          "question": string,
          "sampleAnswer": string,
          "tips": string[],
          "commonMistakes": string[]
        }
      ]
    }
  ]
}

Focus on:
1. Technical questions specific to their skills (${profile.skills?.join(', ')})
2. System design appropriate for their experience level
3. Behavioral questions based on their past experiences
4. Role-specific questions for ${profile.recommendations?.recommendedRoles?.[0]?.title || 'Software Engineering'}

Make questions challenging but appropriate for their experience level. Include detailed sample answers and specific tips.

Profile:
${JSON.stringify(profile, null, 2)}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      });

      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
      }

      try {
        const parsedQuestions = JSON.parse(jsonMatch[0]);

        // Validate the response structure
        if (!parsedQuestions.categories) {
          throw new Error("Invalid response structure");
        }

        // Update profile with interview prep
        const updatedProfile = await storage.updateCareerProfile(profile.id, {
          interviewPrep: parsedQuestions,
        });

        res.json(updatedProfile);
      } catch (error) {
        console.error("Error parsing interview questions:", error);
        res.status(500).json({
          message: "Failed to generate interview questions",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }

    } catch (error) {
      console.error("Error generating interview prep:", error);
      res.status(500).json({
        message: "Failed to generate interview questions",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update the LinkedIn events endpoint
  app.get("/api/linkedin-events/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profile = await storage.getCareerProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Generate comprehensive networking recommendations using Gemini
      const prompt = `You are a professional career networking expert. Based on this profile, generate personalized networking recommendations in JSON format.
Return only a JSON object with this exact structure, nothing else:
{
  "upcoming": [
    {
      "title": string,
      "date": string,
      "type": string,
      "url": string
    }
  ],
  "groups": [
    {
      "name": string,
      "description": string,
      "memberCount": string,
      "relevance": string
    }
  ],
  "influencers": [
    {
      "name": string,
      "title": string,
      "expertise": string[],
      "reason": string
    }
  ],
  "trendingTopics": [
    {
      "topic": string,
      "description": string,
      "suggestedInteraction": string
    }
  ],
  "contentIdeas": [
    {
      "title": string,
      "description": string,
      "targetAudience": string,
      "expectedImpact": string
    }
  ]
}

Profile Details:
Skills: ${JSON.stringify(profile.skills)}
Experience: ${JSON.stringify(profile.experience)}
Education: ${JSON.stringify(profile.education)}
Career Goals: ${JSON.stringify(profile.recommendations?.recommendedRoles || [])}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      });

      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
      }

      try {
        const parsedRecommendations = JSON.parse(jsonMatch[0]);

        // Validate the response structure
        if (!parsedRecommendations.upcoming || !parsedRecommendations.groups ||
            !parsedRecommendations.influencers || !parsedRecommendations.trendingTopics ||
            !parsedRecommendations.contentIdeas) {
          throw new Error("Invalid response structure");
        }

        res.json(parsedRecommendations);
      } catch (error) {
        console.error("Error parsing recommendations:", error);
        throw new Error("Failed to parse networking recommendations");
      }
    } catch (error) {
      console.error("Error generating networking recommendations:", error);
      res.status(500).json({
        message: "Failed to generate networking recommendations",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/portfolio-suggestions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profile = await storage.getCareerProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Generate portfolio suggestions using Gemini
      const prompt = `Based on this career profile, suggest personalized portfolio projects that align with their target roles. Return only a JSON object with this exact structure, nothing else:
{
  "suggestedProjects": [
    {
      "title": string,
      "description": string,
      "timeEstimate": string,
      "technologies": string[],
      "learningOutcomes": string[],
      "implementation": {
        "features": string[],
        "challenges": string[]
      }
    }
  ],
  "skillGaps": [
    {
      "skill": string,
      "projectType": string,
      "importance": string
    }
  ]
}

Profile Details:
- Current Skills: ${JSON.stringify(profile.skills)}
- Experience: ${JSON.stringify(profile.experience)}
- Target Roles: ${JSON.stringify(profile.recommendations?.recommendedRoles || [])}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      });

      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
      }

      try {
        const parsedSuggestions = JSON.parse(jsonMatch[0]);

        // Validate the response structure
        if (!parsedSuggestions.suggestedProjects || !parsedSuggestions.skillGaps) {
          throw new Error("Invalid response structure");
        }

        // Add recommended role context to each project
        parsedSuggestions.suggestedProjects = parsedSuggestions.suggestedProjects.map(project => ({
          ...project,
          targetRole: profile.recommendations?.recommendedRoles?.[0]?.title || "Software Engineer"
        }));

        res.json(parsedSuggestions);
      } catch (error) {
        console.error("Error parsing suggestions:", error);
        throw new Error("Failed to parse portfolio suggestions");
      }
    } catch (error) {
      console.error("Error generating portfolio suggestions:", error);
      res.status(500).json({
        message: "Failed to generate portfolio suggestions",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}