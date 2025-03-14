import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import { insertCareerProfileSchema } from "@shared/schema";
import axios from "axios";

// Add this helper function at the top of the file, after imports
function sanitizeJsonResponse(text: string): string {
  // Remove any control characters that could break JSON parsing
  return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/\\[^\\"\/bfnrtu]/g, "\\\\") // Escape any invalid escape sequences
    .trim();
}

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
    // Extract unique job titles from recommendations
    const recommendedRoles = profile.recommendations?.recommendedRoles || [];
    if (!recommendedRoles.length) {
      console.log("No recommended roles found, using default");
      recommendedRoles.push({ title: "Software Engineer" });
    }
    console.log(
      `Using recommended roles:`,
      recommendedRoles.map((r: any) => r.title),
    );

    // Make separate API calls for each unique role title
    const jobsByRole = await Promise.all(
      recommendedRoles.map(async (role: any) => {
        try {
          const response = await axios.post(
            THEIRSTACK_API_URL,
            {
              page: 0,
              limit: 1, // Only fetch one job per role
              job_title_or: [role.title],
              posted_at_max_age_days: 7,
              company_country_code_or: ["US"],
              include_total_results: true,
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.THEIRSTACK_API_KEY}`,
                "Content-Type": "application/json",
              },
              timeout: 10000, // 10 second timeout
            },
          );

          return response.data.data.map((job: any) => {
            // Define default requirements based on job title
            let defaultRequirements = [];
            let baseMatch = 85; // High base match since it matches the recommended role

            if (job.job_title.toLowerCase().includes("software engineer")) {
              defaultRequirements = [
                "JavaScript",
                "Python",
                "React",
                "Node.js",
                "SQL",
              ];
            } else if (job.job_title.toLowerCase().includes("data engineer")) {
              defaultRequirements = ["Python", "SQL", "ETL", "Hadoop", "Spark"];
            } else if (job.job_title.toLowerCase().includes("cloud engineer")) {
              defaultRequirements = [
                "AWS",
                "Azure",
                "Kubernetes",
                "Docker",
                "Terraform",
              ];
            } else if (job.job_title.toLowerCase().includes("frontend")) {
              defaultRequirements = [
                "React",
                "JavaScript",
                "HTML",
                "CSS",
                "TypeScript",
              ];
            } else if (job.job_title.toLowerCase().includes("backend")) {
              defaultRequirements = [
                "Node.js",
                "Python",
                "Java",
                "SQL",
                "REST APIs",
              ];
            } else {
              defaultRequirements = [
                "Programming",
                "Problem Solving",
                "Communication",
                "Git",
              ];
              baseMatch = 75; // Lower base match for unknown roles
            }

            return {
              title: job.job_title,
              company: job.company_object.name,
              companyLogo: job.company_object.logo,
              location: job.location || job.short_location || "Remote",
              type: job.remote ? "remote" : job.hybrid ? "hybrid" : "onsite",
              description: job.description,
              requirements: defaultRequirements,
              salary: `${job.min_annual_salary_usd ? `$${job.min_annual_salary_usd / 1000}k` : ""} ${job.max_annual_salary_usd ? `- $${job.max_annual_salary_usd / 1000}k` : ""}`,
              postedDate: job.date_posted,
              applicationUrl: job.url,
              skillMatch: baseMatch,
              roleMatch: role.title,
            };
          });
        } catch (error) {
          console.error(`Error fetching jobs for role ${role.title}:`, error);
          return [];
        }
      }),
    );

    // Combine all jobs
    const allJobs = jobsByRole.flat();

    const endTime = Date.now();
    console.log(`TheirStack API calls completed in ${endTime - startTime}ms`);

    return {
      jobs: allJobs,
      totalResults: allJobs.length,
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

function calculateSkillMatch(
  requirements: string[],
  userSkills: string[],
): number {
  if (!requirements.length || !userSkills.length) return 0;

  const reqSet = new Set(requirements.map((s) => s.toLowerCase()));
  const skillSet = new Set(userSkills.map((s) => s.toLowerCase()));

  let matches = 0;
  reqSet.forEach((req) => {
    if (skillSet.has(req)) {
      matches++;
    }
  });

  return Math.round((matches / reqSet.size) * 100);
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

      // Get existing profile (if any)
      const userId = 1; // TODO: Get from auth
      const existingProfile = await storage.getCareerProfile(userId);

      if (existingProfile) {
        console.log("Found existing profile, will be replaced", {
          profileId: existingProfile.id,
        });
      }

      // Analyze resume using Gemini
      const prompt = `Analyze the following resume and extract skills, experience, and education. Return only a JSON object with the following structure, nothing else: { "skills": string[], "experience": { "title": string, "company": string, "duration": string, "description": string[] }[], "education": { "degree": string, "institution": string, "year": string }[] }
Resume text:
${resumeText}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = sanitizeJsonResponse(response.text());

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
      }

      try {
        const parsedAnalysis = JSON.parse(jsonMatch[0]);
        console.log("Successfully analyzed resume with Gemini");

        // Create or update career profile, ensuring all previous analysis is cleared
        const profile = await storage.createCareerProfile({
          userId,
          resumeText,
          linkedinUrl,
          githubUsername,
          skills: parsedAnalysis.skills,
          experience: parsedAnalysis.experience,
          education: parsedAnalysis.education,
          // Explicitly reset all analysis fields
          recommendations: null,
          interviewPrep: null,
          portfolioSuggestions: null,
          analyzedSkills: null,
          targetRoles: null
        });

        console.log("Successfully created/updated career profile", {
          profileId: profile.id,
          isNew: !existingProfile,
        });

        res.json(profile);
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        throw new Error(`Failed to parse resume analysis: ${parseError.message}`);
      }
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
      const prompt = `Based on the following career profile, generate interview preparation materials. Return only a JSON object with the following structure, nothing else: { "categories": [{ "name": string, "description": string, "questions": [{ "question": string, "sampleAnswer": string, "tips": string[], "commonMistakes": string[] }] }] }
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

      const parsedQuestions = JSON.parse(jsonMatch[0]);

      // Update profile with interview prep
      const updatedProfile = await storage.updateCareerProfile(profile.id, {
        interviewPrep: parsedQuestions,
      });

      res.json(updatedProfile);
    } catch (error) {
      console.error("Error generating interview prep:", error);
      res.status(500).json({
        message: "Failed to generate interview questions",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/resume-feedback/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profile = await storage.getCareerProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const prompt = `You are a professional resume reviewer tasked with providing constructive feedback and a fair impact score. When calculating the impact score:
- Start with a base score of 60
- Add points for positive elements (skills matching industry standards, quantifiable achievements, clear progression)
- Subtract points only for significant issues
- The final score should typically fall between 50-95, with most resumes scoring 75-85
- A score below 60 should only be given if there are major structural issues

Based on this resume text, provide detailed, constructive feedback for improvement. Return only a JSON object with this structure:
{
  "overview": {
    "strengths": string[],
    "improvements": string[]
  },
  "sections": {
    "summary": { "feedback": string, "suggestions": string[] },
    "experience": { "feedback": string, "suggestions": string[] },
    "skills": { "feedback": string, "suggestions": string[] },
    "education": { "feedback": string, "suggestions": string[] }
  },
  "formatting": {
    "issues": string[],
    "recommendations": string[]
  },
  "impactScore": number
}

Resume Text:
${profile.resumeText}`;

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

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
      }

      const feedback = JSON.parse(jsonMatch[0]);
      res.json(feedback);
    } catch (error) {
      console.error("Error generating resume feedback:", error);
      res.status(500).json({
        message: "Failed to generate resume feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/linkedin-events/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profile = await storage.getCareerProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const currentDate = new Date().toISOString().split("T")[0];

      const prompt = `You are a professional career networking expert. Based on this profile, generate personalized networking recommendations in JSON format. Only include events on or after ${currentDate}.

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

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
      }

      try {
        const parsedRecommendations = JSON.parse(jsonMatch[0]);

        // Validate the response structure
        if (
          !parsedRecommendations.upcoming ||
          !parsedRecommendations.groups ||
          !parsedRecommendations.influencers ||
          !parsedRecommendations.trendingTopics ||
          !parsedRecommendations.contentIdeas
        ) {
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
        details: error instanceof Error ? error.message : "Unknown error",
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
      const prompt = `Based on this career profile, suggest personalized portfolio projects that align with their target roles. 
Format your response as a JSON object with this EXACT structure and ONLY these fields, nothing else:
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
        if (!parsedSuggestions.suggestedProjects || !parsedSuggestions.skillGaps ||
            !Array.isArray(parsedSuggestions.suggestedProjects) || !Array.isArray(parsedSuggestions.skillGaps)) {
          throw new Error("Invalid response structure");
        }

        // Validate each project has required fields
        parsedSuggestions.suggestedProjects.forEach((project: any) => {
          if (!project.title || !project.description || !project.timeEstimate || 
              !Array.isArray(project.technologies) || !Array.isArray(project.learningOutcomes) ||
              !project.implementation || !Array.isArray(project.implementation.features) ||
              !Array.isArray(project.implementation.challenges)) {
            throw new Error("Invalid project structure");
          }
        });

        // Add recommended role context to each project
        parsedSuggestions.suggestedProjects = parsedSuggestions.suggestedProjects.map((project) => ({
          ...project,
          targetRole: profile.recommendations?.recommendedRoles?.[0]?.title || "Software Engineer",
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
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}