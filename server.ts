import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import multer from "multer";
import rateLimit from "express-rate-limit";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Helper to initialize Gemini API per request
  const getAI = (userApiKey?: string) => {
    if (!userApiKey) {
      throw new Error("Missing API Key. Please configure your API key in Settings.");
    }
    return new GoogleGenAI({
      apiKey: userApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  app.use(express.json({ limit: "50mb" }));

  // Create a rate limiter for the API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: "Too many requests from this IP, please try again after 15 minutes" }
  });

  let activeConnections = 0;
  const adminClients = new Set<express.Response>();
  const activeUsersMap = new Map<string, number>();
  
  // Persist registered users across server restarts
  const usersFile = path.join(process.cwd(), 'users.json');
  let registeredUsers = new Set<string>();
  try {
    if (fs.existsSync(usersFile)) {
      const data = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      registeredUsers = new Set(data);
    }
  } catch (e) {
    console.error('Failed to load users', e);
  }
  
  function saveUsers() {
    try {
      fs.writeFileSync(usersFile, JSON.stringify(Array.from(registeredUsers)));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  }

  function broadcastUserCount() {
    const activeCount = activeUsersMap.size;
    const totalCount = registeredUsers.size;
    
    const usersList = Array.from(registeredUsers).map(u => ({
      username: u,
      active: activeUsersMap.has(u)
    }));

    const data = `data: ${JSON.stringify({ 
      activeConnections,
      activeUsers: activeCount,
      totalUsers: totalCount,
      inactiveUsers: totalCount - activeCount,
      usersList
    })}\n\n`;
    
    for (const client of adminClients) {
      client.write(data);
    }
  }

  app.get('/api/presence', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    activeConnections++;
    
    const username = req.query.username as string;
    if (username && username !== 'admin') {
      if (!registeredUsers.has(username)) {
        registeredUsers.add(username);
        saveUsers();
      }
      activeUsersMap.set(username, (activeUsersMap.get(username) || 0) + 1);
    }
    
    broadcastUserCount();

    req.on('close', () => {
      activeConnections--;
      if (username && username !== 'admin') {
        const current = activeUsersMap.get(username) || 0;
        if (current <= 1) {
          activeUsersMap.delete(username);
        } else {
          activeUsersMap.set(username, current - 1);
        }
      }
      broadcastUserCount();
    });
  });

  app.get('/api/admin/presence', (req, res) => {
    const adminKey = req.query.key;
    if (adminKey !== (process.env.ADMIN_SECRET || 'AniketSB@4581172')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    adminClients.add(res);
    
    const activeCount = activeUsersMap.size;
    const totalCount = registeredUsers.size;
    const usersList = Array.from(registeredUsers).map(u => ({
      username: u,
      active: activeUsersMap.has(u)
    }));

    res.write(`data: ${JSON.stringify({ 
      activeConnections,
      activeUsers: activeCount,
      totalUsers: totalCount,
      inactiveUsers: totalCount - activeCount,
      usersList
    })}\n\n`);

    req.on('close', () => {
      adminClients.delete(res);
    });
  });

  app.post('/api/admin/clear-users', (req, res) => {
    const adminKey = req.body.key;
    if (adminKey !== (process.env.ADMIN_SECRET || 'AniketSB@4581172')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    registeredUsers.clear();
    activeUsersMap.clear();
    saveUsers();
    
    broadcastUserCount();
    res.json({ success: true });
  });

  // API Routes
  app.post("/api/analyze", apiLimiter, upload.single("file"), async (req, res) => {
    try {
      const { step, textInput, inputType, selectedOption, apiKey } = req.body;
      
      if (!step || !inputType) {
        return res.status(400).json({ error: "Missing step or inputType" });
      }

      let contents: any[] = [];
      
      if (inputType === 'text') {
        if (!textInput) return res.status(400).json({ error: "No text input provided" });
        contents.push(`User input text: ${textInput}`);
      } else if (req.file) {
        contents.push({
          inlineData: {
            data: req.file.buffer.toString('base64'),
            mimeType: req.file.mimetype
          }
        });
      } else {
        return res.status(400).json({ error: "No input file provided" });
      }

      if (step === 'options') {
        const systemInstruction = `You are an expert AI Teaching Assistant. Analyze the provided classroom input (image of board, audio recording, or text notes).
Identify up to 3 possible distinct topics or interpretations of what is being taught.
Return a JSON array of 3 options, each with a title and a brief summary.
If there's clearly only one topic, provide 3 different angles, depths, or subtopics.`;

        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING }
                },
                required: ["id", "title", "summary"]
              }
            }
          },
          required: ["options"]
        };

        const response = await getAI(apiKey).models.generateContent({
          model: "gemini-flash-lite-latest",
          contents: [
            ...contents,
            "Extract 3 possible topic interpretations from this input."
          ],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema
          }
        });
        
        const textResponse = response.text;
        if (!textResponse) throw new Error("No response from Gemini");
        
        let parsed;
        try {
          parsed = JSON.parse(textResponse.replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) {
          console.error("Failed to parse Gemini response:", textResponse);
          throw new Error("Gemini returned invalid format. Please try again.");
        }
        
        return res.json(parsed);
        
      } else if (step === 'generate') {
        contents.push(`The user has selected the following topic/interpretation to focus on:\n${selectedOption}\n\nGenerate detailed notes, a quiz, and resources strictly focused on this selected topic.`);
        
        const systemInstruction = `You are an expert AI Product Architect, Computer Vision Engineer, Machine Learning Researcher, and Teaching Assistant.
Your task is to analyze the input (image, text, or audio) with a strong focus on the user's selected topic.

Generate highly structured educational content.
Generate a concise lecture summary.
Detect any homework, assignments, or lab work mentioned.
Generate structured notes.
Generate a quick quiz (MCQs) based on the content.
Provide learning resources.

Return ONLY a valid JSON object with the specified schema.`;

        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            imageQuality: {
              type: Type.OBJECT,
              properties: {
                quality: { type: Type.STRING, description: "e.g., 'Good', 'Moderate', 'Poor', 'N/A'" },
                confidenceScore: { type: Type.NUMBER, description: "0 to 100" }
              },
              required: ["quality", "confidenceScore"]
            },
            transcription: { type: Type.STRING, description: "If the input was audio, provide the full transcription here. Otherwise, empty string." },
            subjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subjectName: { type: Type.STRING },
                  topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                  confidence: { type: Type.NUMBER, description: "0 to 100" }
                },
                required: ["subjectName", "topics", "confidence"]
              }
            },
            lectureSummary: { type: Type.STRING },
            homework: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of homework or assignments. Empty if none."
            },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key formulas, definitions, or code concepts."
            },
            generatedNotes: {
              type: Type.OBJECT,
              properties: {
                short: { type: Type.STRING },
                detailed: { type: Type.STRING }
              },
              required: ["short", "detailed"]
            },
            generatedQuiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  type: { type: Type.STRING, description: "e.g., 'MCQ', 'Viva', 'Coding'" },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Only for MCQ. Provide exactly 4 options." },
                  answer: { type: Type.STRING, description: "The correct option from the options array." }
                },
                required: ["question", "type", "answer", "options"]
              }
            },
            resources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Title of the resource" },
                  url: { type: Type.STRING, description: "A real URL, or a search URL like https://www.youtube.com/results?search_query=... or https://www.google.com/search?q=..." },
                  type: { type: Type.STRING, description: "e.g., 'Video', 'Article', 'Documentation', 'Practice'" }
                },
                required: ["title", "url", "type"]
              },
              description: "List of helpful internet resources for further study."
            }
          },
          required: [
            "imageQuality",
            "subjects",
            "lectureSummary",
            "homework",
            "keyConcepts",
            "generatedNotes",
            "generatedQuiz",
            "resources",
            "transcription"
          ]
        };

        const response = await getAI(apiKey).models.generateContent({
          model: "gemini-flash-lite-latest",
          contents: contents,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema
          }
        });

        const textResponse = response.text;
        if (!textResponse) {
          throw new Error("No text response from Gemini");
        }

        let parsed;
        try {
          parsed = JSON.parse(textResponse.replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) {
          console.error("Failed to parse Gemini response:", textResponse);
          throw new Error("Gemini returned invalid format. Please try again.");
        }

        return res.json(parsed);
      }
    } catch (error: any) {
      console.error("Error analyzing input:", error);
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
        return res.status(429).json({ error: "API quota exceeded. Please wait a moment and try again." });
      }
      res.status(500).json({ error: error.message || "Failed to analyze input" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
