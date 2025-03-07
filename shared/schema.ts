import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const careerProfiles = pgTable("career_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  resumeText: text("resume_text"),
  linkedinUrl: text("linkedin_url"),
  githubUsername: text("github_username"),
  skills: text("skills").array(),
  experience: jsonb("experience"),
  education: jsonb("education"),
  analyzedSkills: jsonb("analyzed_skills"),
  targetRoles: jsonb("target_roles"),
  recommendations: jsonb("recommendations"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCareerProfileSchema = createInsertSchema(careerProfiles).omit({
  id: true,
  analyzedSkills: true,
  recommendations: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type CareerProfile = typeof careerProfiles.$inferSelect;
export type InsertCareerProfile = z.infer<typeof insertCareerProfileSchema>;
