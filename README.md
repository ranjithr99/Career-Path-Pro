# CareerPathPro

A career path planning and management application.

## API Keys Configuration

This application uses several external APIs that require API keys. These keys are stored in a `.env` file in the root directory.

### Required API Keys

- `THEIRSTACK_API_KEY`: Used for job search functionality
- `GOOGLE_API_KEY`: Used for AI-powered features with Google's Gemini model
- `OPENAI_API_KEY`: Used for AI-powered features with OpenAI

### Setting Up API Keys

1. Create a `.env` file in the root directory of the project
2. Add your API keys in the following format:
```
THEIRSTACK_API_KEY=your_theirstack_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```
3. The application will automatically load these keys when it starts

### Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already added to `.gitignore` to prevent accidental commits
- For production deployment, set these environment variables in your hosting platform

## Local Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Running the Application Locally
The application has been configured to run on port 3000 with localhost. You can start the application in development mode using:

```bash
npm run dev
```

This will start both the server and client on http://localhost:3000.

### Alternative Development Commands

- Run only the client:
```bash
npm run client
```

- Run only the server:
```bash
npm run server
```

### Building for Production

1. Build both client and server:
```bash
npm run build
```

2. Or build them separately:
```bash
npm run build:client
npm run build:server
```

3. Run the production build:
```bash
npm run prod
```

## Project Structure

- `client/`: Frontend React application
- `server/`: Backend Express server
- `shared/`: Shared code between client and server
- `dist/`: Production build output 