import { users, careerProfiles, type User, type InsertUser, type CareerProfile, type InsertCareerProfile } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCareerProfile(userId: number): Promise<CareerProfile | undefined>;
  createCareerProfile(profile: InsertCareerProfile): Promise<CareerProfile>;
  updateCareerProfile(id: number, profile: Partial<CareerProfile>): Promise<CareerProfile>;
  clearCareerProfile(userId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private careerProfiles: Map<number, CareerProfile>;
  private currentUserId: number;
  private currentProfileId: number;

  constructor() {
    this.users = new Map();
    this.careerProfiles = new Map();
    this.currentUserId = 1;
    this.currentProfileId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCareerProfile(userId: number): Promise<CareerProfile | undefined> {
    return Array.from(this.careerProfiles.values()).find(
      (profile) => profile.userId === userId,
    );
  }

  async createCareerProfile(profile: InsertCareerProfile): Promise<CareerProfile> {
    // First, clear any existing profile for this user
    await this.clearCareerProfile(profile.userId || 0);
    
    const id = this.currentProfileId++;
    const newProfile = {
      id,
      userId: profile.userId ?? null,
      resumeText: profile.resumeText ?? null,
      linkedinUrl: profile.linkedinUrl ?? null,
      githubUsername: profile.githubUsername ?? null,
      skills: profile.skills ?? null,
      experience: profile.experience ?? null,
      education: profile.education ?? null,
      analyzedSkills: {},
      targetRoles: {},
      recommendations: {}
    } satisfies CareerProfile;

    this.careerProfiles.set(id, newProfile);
    return newProfile;
  }

  async updateCareerProfile(id: number, profile: Partial<CareerProfile>): Promise<CareerProfile> {
    const existingProfile = this.careerProfiles.get(id);
    if (!existingProfile) {
      throw new Error("Profile not found");
    }
    const updatedProfile = { ...existingProfile, ...profile } satisfies CareerProfile;
    this.careerProfiles.set(id, updatedProfile);
    return updatedProfile;
  }
  
  async clearCareerProfile(userId: number): Promise<void> {
    // Find all profiles for this user
    const profilesForUser = Array.from(this.careerProfiles.entries())
      .filter(([_, profile]) => profile.userId === userId);
    
    // Delete each profile
    for (const [id, _] of profilesForUser) {
      this.careerProfiles.delete(id);
    }
    
    console.log(`Cleared ${profilesForUser.length} career profiles for user ${userId}`);
  }
}

export const storage = new MemStorage();