import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const rawApiKey = process.env.GEMINI_API_KEY;
const apiKey = rawApiKey && rawApiKey !== 'MY_GEMINI_API_KEY' && rawApiKey.trim().length > 10 ? rawApiKey.trim() : null;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Heuristic fallback parser if Gemini API is unavailable or offline
function fallbackParseSyllabus(rawText: string, defaultName?: string) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const units: Array<{ title: string; topics: Array<{ title: string; estimatedHours: number; difficulty: 'easy' | 'medium' | 'hard' }> }> = [];
  
  let currentUnit = {
    title: 'Unit 1: Course Foundations',
    topics: [] as Array<{ title: string; estimatedHours: number; difficulty: 'easy' | 'medium' | 'hard' }>,
  };

  const detectedAssessments: Array<{ title: string; type: 'exam' | 'assignment' | 'quiz' | 'project'; daysFromNow: number; weightPercentage: number }> = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    
    // Check for assessment mention
    if (lower.includes('exam') || lower.includes('midterm') || lower.includes('final')) {
      detectedAssessments.push({
        title: line.replace(/^[-*•\d.]+\s*/, ''),
        type: 'exam',
        daysFromNow: lower.includes('midterm') ? 10 : 21,
        weightPercentage: lower.includes('final') ? 35 : 20,
      });
    } else if (lower.includes('assignment') || lower.includes('homework') || lower.includes('project')) {
      detectedAssessments.push({
        title: line.replace(/^[-*•\d.]+\s*/, ''),
        type: lower.includes('project') ? 'project' : 'assignment',
        daysFromNow: 7,
        weightPercentage: 10,
      });
    }

    // Check for Unit / Module / Chapter boundary
    if (/^(unit|module|chapter|part|section|week)\s*\d+[:.-]?/i.test(line) || /^#+\s+/i.test(line)) {
      if (currentUnit.topics.length > 0) {
        units.push(currentUnit);
      }
      currentUnit = {
        title: line.replace(/^#+\s*/, ''),
        topics: [],
      };
    } else if (line.length > 2) {
      // Treat as topic
      const cleanTitle = line.replace(/^[-*•\d.)\]]+\s*/, '');
      if (cleanTitle.length > 1) {
        currentUnit.topics.push({
          title: cleanTitle,
          estimatedHours: 2.0,
          difficulty: cleanTitle.length > 35 ? 'hard' : 'medium',
        });
      }
    }
  }

  if (currentUnit.topics.length > 0) {
    units.push(currentUnit);
  }

  // If no units were created, create one with whatever lines we have
  if (units.length === 0) {
    units.push({
      title: 'Module 1: General Syllabus Topics',
      topics: lines.slice(0, 10).map(l => ({
        title: l.replace(/^[-*•\d.)\]]+\s*/, ''),
        estimatedHours: 2.0,
        difficulty: 'medium',
      })),
    });
  }

  return {
    subjectName: defaultName || 'Imported Subject Course',
    subjectCode: 'CRS 101',
    units,
    detectedAssessments: detectedAssessments.slice(0, 5),
  };
}

// AI-powered syllabus breakdown endpoint
app.post('/api/parse-syllabus', async (req: Request, res: Response): Promise<void> => {
  const { text, subjectName } = req.body;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text content is required' });
    return;
  }

  if (!ai) {
    // Return heuristic parsing result
    const parsed = fallbackParseSyllabus(text, subjectName);
    res.json(parsed);
    return;
  }

  try {
    const prompt = `Analyze this course syllabus or syllabus outline and convert it into a structured study breakdown.
    Extract:
    1. Subject Name and Subject Code (e.g. CS 301, MATH 201).
    2. Units/Modules/Chapters with their individual topics.
    3. For each topic, estimate study hours (typically 1.5 to 4.0 hours) and difficulty ('easy', 'medium', or 'hard').
    4. Any detected exams, midterms, finals, quizzes, or assignments mentioned with reasonable daysFromNow estimate (e.g., midterm in 7-14 days, final in 20-30 days) and weightPercentage.

    Syllabus content:
    ${text.slice(0, 8000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjectName: { type: Type.STRING },
            subjectCode: { type: Type.STRING },
            units: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  topics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        estimatedHours: { type: Type.NUMBER },
                        difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                      },
                      required: ['title'],
                    },
                  },
                },
                required: ['title', 'topics'],
              },
            },
            detectedAssessments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['exam', 'assignment', 'quiz', 'project', 'presentation'] },
                  daysFromNow: { type: Type.NUMBER },
                  weightPercentage: { type: Type.NUMBER },
                  notes: { type: Type.STRING },
                },
                required: ['title', 'type'],
              },
            },
          },
          required: ['units'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    if (!parsedData.units || parsedData.units.length === 0) {
      throw new Error('No units generated by model');
    }

    res.json(parsedData);
  } catch (err: unknown) {
    console.warn('Gemini syllabus parse failed, falling back to heuristic parser:', err);
    const fallback = fallbackParseSyllabus(text, subjectName);
    res.json(fallback);
  }
});

// Swift Holographic AI Copilot Chat Endpoint (Bilingual English / Hindi / Hinglish)
app.post('/api/swift/chat', async (req: Request, res: Response): Promise<void> => {
  const { message, language = 'hinglish', context } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  // Fallback response generator if Gemini is not reachable or offline
  const generateFallbackResponse = (userMsg: string, lang: string) => {
    const lower = userMsg.toLowerCase();
    const coursesSummary = context?.courses?.map((c: { name: string; daysLeft: number; coverage: number }) => `${c.name} (${c.daysLeft}d left, ${c.coverage}% covered)`).join(', ') || 'No active courses logged yet';
    const nearestExam = context?.nearestExam ? `${context.nearestExam.title} in ${context.nearestExam.daysLeft} days` : 'None in the next 7 days';

    if (lang === 'hi') {
      if (lower.includes('din') || lower.includes('exam') || lower.includes('pariksha')) {
        return `नमस्ते! आपकी अगली परीक्षा ${nearestExam} है। अपने रिवीज़न पर पूरा ध्यान दीजिए।`;
      }
      if (lower.includes('syllabus') || lower.includes('bacha') || lower.includes('coverage')) {
        return `आपके कोर्सेज का स्टेटस: ${coursesSummary}। आज के तय टॉपिक्स को पूरा करें!`;
      }
      return `नमस्ते, मैं स्विफ्ट हूँ! आपकी परीक्षा की तैयारी में पूरी मदद करूँगा। आज क्या पढ़ना चाहते हैं?`;
    }

    if (lang === 'hinglish') {
      if (lower.includes('exam') || lower.includes('din') || lower.includes('days') || lower.includes('kab')) {
        return `Hey! Aapki sabse nearest exam hai: ${nearestExam}. Fasten your seatbelt aur aaj ke topics finish karein!`;
      }
      if (lower.includes('syllabus') || lower.includes('coverage') || lower.includes('kitna')) {
        return `Current telemetry check: ${coursesSummary}. High study velocity maintain rakhein!`;
      }
      return `Main hoon Swift - aapka holographic cockpit study copilot! Bataiye aaj study roadmap me kis topic pe focus karna hai?`;
    }

    // Default English
    if (lower.includes('exam') || lower.includes('day') || lower.includes('due')) {
      return `Telemetry check: Your nearest deadline is ${nearestExam}. Keep your daily study RPM on target!`;
    }
    if (lower.includes('syllabus') || lower.includes('coverage') || lower.includes('remaining')) {
      return `Current curriculum telemetry: ${coursesSummary}. Pacing looks sharp!`;
    }
    return `Swift HUD online. I'm tracking your exam countdowns and syllabus milestones. What topic are we tackling right now?`;
  };

  if (!ai) {
    res.json({ reply: generateFallbackResponse(message, language) });
    return;
  }

  try {
    const systemPrompt = `You are "Swift", an advanced futuristic holographic AI assistant living inside a sleek, glowing holographic Swift sports car cockpit HUD.
Your personality is sharp, dynamic, encouraging, and razor-focused on the student's academic success.
Model Language Instruction:
- If language is 'hi', reply purely in polite, natural conversational Hindi (Devanagari script or clear phonetic Hindi).
- If language is 'hinglish', reply in natural, modern conversational Indian Hinglish (blend of English & Hindi, popular with college students in India, e.g. "Aapke Math exam me sirf 8 din bache hain! Aaj target hai 2 topics cover karna.").
- If language is 'en', reply in crisp, confident English with automotive/cockpit flavor (e.g. "Swift telemetry online", "Study RPM", "Course trajectory").
Rules:
1. Always keep responses brief (2 to 3 sentences maximum) so voice speech synthesis can speak it smoothly without long delays.
2. Directly answer questions about their syllabus coverage, remaining days, exams, or subject concepts.
3. Be enthusiastic and keep them motivated!

Student Context:
${JSON.stringify(context || {})}`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const reply = response.text?.trim() || generateFallbackResponse(message, language);
    res.json({ reply });
  } catch (err) {
    console.warn('Swift chat using fallback:', err);
    res.json({ reply: generateFallbackResponse(message, language) });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SyllabusDesk server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
