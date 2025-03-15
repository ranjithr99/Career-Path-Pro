import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
config();

// Define schema for environment variables
const envSchema = z.object({
  // API Keys
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  GOOGLE_API_KEY: z.string().min(1, 'Google API key is required'),
  THEIRSTACK_API_KEY: z.string().min(1, 'TheirStack API key is required'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
});

// Parse and validate environment variables
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment variables');
  }
  
  return result.data;
};

// Export validated environment variables
export const env = parseEnv();

// Export specific configurations
export const apiKeys = {
  openai: env.OPENAI_API_KEY,
  google: env.GOOGLE_API_KEY,
  theirstack: env.THEIRSTACK_API_KEY,
};

export const database = {
  url: env.DATABASE_URL,
};

export const app = {
  environment: env.NODE_ENV,
  port: env.PORT,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
}; 