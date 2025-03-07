import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import multer from "multer";
import { insertCareerProfileSchema } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

      // Analyze resume using OpenAI
      const analysis = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Analyze the resume and extract skills, experience, and education. Return in JSON format with the following structure: { skills: string[], experience: { title: string, company: string, duration: string, description: string[] }[], education: { degree: string, institution: string, year: string }[] }"
          },
          {
            role: "user",
            content: resumeText
          }
        ],
        response_format: { type: "json_object" }
      });

      const parsedAnalysis = JSON.parse(analysis.choices[0].message.content);
      console.log("Successfully analyzed resume with OpenAI");

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

      // Generate career recommendations using OpenAI
      const recommendations = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Based on the profile, suggest career paths and recommendations. Return in JSON format with the following structure: { recommendedRoles: { title: string, industry: string, matchPercentage: number, requiredSkills: string[], growthPotential: string, requiredExperience: string }[] }"
          },
          {
            role: "user",
            content: JSON.stringify(profile)
          }
        ],
        response_format: { type: "json_object" }
      });

      const parsedRecommendations = JSON.parse(recommendations.choices[0].message.content);

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