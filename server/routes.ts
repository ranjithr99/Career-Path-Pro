import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import { insertCareerProfileSchema } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Initialize Google AI with Gemini model
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function registerRoutes(app: Express): Promise<Server> {
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
      const prompt = `Based on the following career profile, suggest career paths and recommendations. Return only a JSON object with the following structure, nothing else: { "recommendedRoles": { "title": string, "industry": string, "matchPercentage": number, "requiredSkills": string[], "growthPotential": string, "requiredExperience": string }[] }

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

  const httpServer = createServer(app);
  return httpServer;
}