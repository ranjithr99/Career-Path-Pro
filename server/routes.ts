import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import { insertCareerProfileSchema } from "@shared/schema";
import axios from 'axios';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
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
const THEIRSTACK_API_URL = 'https://api.theirstack.com/v1/jobs/search';

// Verify API key is loaded
if (!process.env.THEIRSTACK_API_KEY) {
  console.error('THEIRSTACK_API_KEY is not set. Job search functionality will not work.');
}

async function fetchJobPostings(profile: any) {
  console.log(`Fetching jobs`);
  const startTime = Date.now();

  try {
    // Extract job titles from recommendations
    const jobTitles = profile.recommendations?.recommendedRoles?.map((role: any) => role.title) || ["Software Engineer"];
    console.log(`Searching for job titles:`, jobTitles);

    const response = await axios.post(THEIRSTACK_API_URL, {
      page: 0,
      limit: 5, // Limiting to 5 jobs per request
      job_title_or: jobTitles,
      posted_at_max_age_days: 7,
      company_country_code_or: ["US"],
      include_total_results: true
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.THEIRSTACK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    const endTime = Date.now();
    console.log(`TheirStack API call completed in ${endTime - startTime}ms`);

    return {
      jobs: response.data.data.map((job: any) => {
        const userSkills = new Set(profile.skills?.map((s: string) => s.toLowerCase()) || []);
        const jobSkills = new Set(job.technology_slugs?.map((s: string) => s.toLowerCase()) || []);

        // Calculate skill match
        let matchedSkills = 0;
        let totalSkills = jobSkills.size;

        if (totalSkills === 0) {
          totalSkills = 1; // Prevent division by zero
        }

        jobSkills.forEach((skill: string) => {
          if (userSkills.has(skill)) {
            matchedSkills++;
          }
        });

        const skillMatch = Math.round((matchedSkills / totalSkills) * 100);

        return {
          title: job.job_title,
          company: job.company_object.name,
          companyLogo: job.company_object.logo,
          location: job.location || job.short_location || 'Remote',
          type: job.remote ? 'remote' : (job.hybrid ? 'hybrid' : 'onsite'),
          description: job.description,
          requirements: job.technology_slugs || [],
          salary: `${job.min_annual_salary_usd ? `$${job.min_annual_salary_usd/1000}k` : ''} ${job.max_annual_salary_usd ? `- $${job.max_annual_salary_usd/1000}k` : ''}`,
          postedDate: job.date_posted,
          applicationUrl: job.url,
          skillMatch: skillMatch
        };
      }),
      totalResults: response.data.metadata.total_results || 0
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('TheirStack API error:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
        duration: Date.now() - startTime
      });

      if (error.code === 'ECONNABORTED') {
        throw new Error('TheirStack API request timed out');
      }
    } else {
      console.error('Unexpected error while fetching jobs:', error);
    }
    return { jobs: [], totalResults: 0 };
  }
}

function calculateSkillMatch(requirements: string[], userSkills: string[]): number {
  if (!requirements.length || !userSkills.length) return 0;

  const reqSet = new Set(requirements.map(s => s.toLowerCase()));
  const skillSet = new Set(userSkills.map(s => s.toLowerCase()));

  let matches = 0;
  reqSet.forEach(req => {
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
        hasApiKey: !!process.env.THEIRSTACK_API_KEY
      });

      const profile = await storage.getCareerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const result = await fetchJobPostings(profile);

      console.log(`Job postings request completed in ${Date.now() - startTime}ms`, {
        totalJobs: result.jobs.length,
        totalResults: result.totalResults
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching job postings:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Job postings request failed after ${Date.now() - startTime}ms:`, errorMessage);

      res.status(500).json({ 
        message: "Failed to fetch job postings",
        details: errorMessage
      });
    }
  });

  app.post("/api/career-profile", upload.single("resume"), async (req, res) => {
    try {
      console.log("Received career profile request", {
        file: req.file ? "present" : "missing",
        body: req.body
      });

      const resumeFile = req.file;
      const { linkedinUrl, githubUsername } = req.body;

      if (!resumeFile) {
        console.log("Resume file missing in request");
        return res.status(400).json({ message: "Resume file is required" });
      }

      // Extract text from resume
      const resumeText = resumeFile.buffer.toString("utf-8");
      console.log("Successfully extracted resume text", { length: resumeText.length });

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
        education: parsedAnalysis.education
      });

      console.log("Successfully created career profile", { profileId: profile.id });
      res.json(profile);
    } catch (error) {
      console.error("Error processing career profile:", error);
      res.status(500).json({ 
        message: "Failed to process career profile", 
        details: error instanceof Error ? error.message : "Unknown error" 
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
        recommendations: parsedRecommendations
      });

      res.json(updatedProfile);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ 
        message: "Failed to generate recommendations",
        details: error instanceof Error ? error.message : "Unknown error"
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
        interviewPrep: parsedQuestions
      });

      res.json(updatedProfile);
    } catch (error) {
      console.error("Error generating interview prep:", error);
      res.status(500).json({ 
        message: "Failed to generate interview questions",
        details: error instanceof Error ? error.message : "Unknown error"
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

      // Generate comprehensive networking recommendations using Gemini
      const prompt = `Based on the following career profile, provide detailed networking recommendations. Return only a JSON object with the following structure:
{
  "upcoming": [{ "title": string, "date": string, "type": string, "url": string }],
  "groups": [{ "name": string, "description": string, "memberCount": string, "relevance": string }],
  "influencers": [{ "name": string, "title": string, "expertise": string[], "reason": string }],
  "trendingTopics": [{ "topic": string, "description": string, "suggestedInteraction": string }],
  "contentIdeas": [{ "title": string, "description": string, "targetAudience": string, "expectedImpact": string }]
}

Profile skills and interests:
${JSON.stringify(profile.skills)}
${JSON.stringify(profile.experience)}
${JSON.stringify(profile.education)}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
      }

      const parsedRecommendations = JSON.parse(jsonMatch[0]);
      res.json(parsedRecommendations);
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
      const prompt = `Based on the following career profile, suggest personalized portfolio projects. Return only a JSON object with the following structure:
{
  "suggestedProjects": [{
    "title": string,
    "description": string,
    "difficulty": "beginner" | "intermediate" | "advanced",
    "timeEstimate": string,
    "technologies": string[],
    "learningOutcomes": string[],
    "industryRelevance": string,
    "implementation": {
      "features": string[],
      "architecture": string,
      "challenges": string[]
    }
  }],
  "skillGaps": [{
    "skill": string,
    "projectType": string,
    "importance": string
  }]
}

Profile:
${JSON.stringify({
  skills: profile.skills,
  experience: profile.experience,
  education: profile.education,
  targetRoles: profile.targetRoles
}, null, 2)}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response as JSON");
      }

      const parsedSuggestions = JSON.parse(jsonMatch[0]);
      res.json(parsedSuggestions);
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