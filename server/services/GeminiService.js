const axios = require("axios");

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl =
      process.env.GEMINI_API_URL ||
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
    this.connected = false; // renamed to avoid clash
    this.testConnection();
  }

  async testConnection() {
    try {
      if (!this.apiKey) {
        console.warn("Gemini API key not configured");
        this.connected = false;
        return;
      }

      // Test connection with a small valid request
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [{ text: "Hello Gemini, test connection." }],
            },
          ],
        },
        { timeout: 5000, headers: { "Content-Type": "application/json" } }
      );

      if (response.data?.candidates?.length > 0) {
        this.connected = true;
        console.log("✅ Gemini API connection successful");
      } else {
        this.connected = false;
        console.error("❌ Gemini API responded but no candidates found.");
      }
    } catch (error) {
      console.error("❌ Gemini API connection failed:", error.message);
      this.connected = false;
    }
  }

  async getResponse(userInput, session) {
    try {
      if (!this.connected) {
        throw new Error("Gemini API not connected");
      }

      const prompt = this.buildPrompt(userInput, session);

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        },
        {
          timeout: 30000,
          headers: { "Content-Type": "application/json" },
        }
      );

      const aiResponse =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Translate if needed
      let translatedResponse = aiResponse;
      if (session.language !== "en") {
        translatedResponse = await this.translateText(
          aiResponse,
          session.language
        );
      }

      // Voice response (mock)
      let audioResponse = null;
      if (session.settings?.voiceEnabled) {
        audioResponse = await this.generateVoiceResponse(
          translatedResponse,
          session.voice
        );
      }

      return {
        text: translatedResponse,
        originalText: aiResponse,
        audio: audioResponse,
        language: session.language,
        voice: session.voice,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error getting Gemini response:", error);
      throw new Error("Failed to get AI response");
    }
  }

  buildPrompt(userInput, session) {
    const language = session.language;
    const context = session.history?.slice(-5) || [];

    let prompt = `You are a helpful AI assistant. The user is speaking in ${this.getLanguageName(
      language
    )}. `;

    if (context.length > 0) {
      prompt += `\n\nRecent conversation context:\n`;
      context.forEach((entry) => {
        prompt += `User: ${entry.userInput}\nAI: ${entry.aiResponse}\n`;
      });
    }

    prompt += `\n\nCurrent user input: ${userInput}\n\nPlease respond naturally in ${this.getLanguageName(
      language
    )}. Keep your response concise and conversational.`;

    return prompt;
  }

  getLanguageName(code) {
    const languages = {
      en: "English",
      hi: "Hindi",
      hinglish: "Hinglish (mix of Hindi and English)",
    };
    return languages[code] || "English";
  }

  async translateText(text, targetLanguage) {
    try {
      if (targetLanguage === "en") return text;

      const prompt = `Translate the following text to ${this.getLanguageName(
        targetLanguage
      )}:\n\n"${text}"\n\nTranslation:`;

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        },
        { timeout: 15000, headers: { "Content-Type": "application/json" } }
      );

      return (
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text.trim() || text
      );
    } catch (error) {
      console.error("Translation error:", error.message);
      return text;
    }
  }

  async generateVoiceResponse(text, voice) {
    try {
      return {
        audioUrl: "/api/tts",
        method: "POST",
        payload: { text, voice, languageCode: "en-US" },
      };
    } catch (error) {
      console.error("Voice generation error:", error.message);
      return null;
    }
  }

  async detectLanguage(text) {
    try {
      const prompt = `Detect the language of the following text and respond with only the language code (en, hi, hinglish):\n\n"${text}"\n\nLanguage:`;

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 10 },
        },
        { timeout: 10000, headers: { "Content-Type": "application/json" } }
      );

      const detected =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text
          .trim()
          .toLowerCase() || "en";

      const languageMap = {
        english: "en",
        en: "en",
        hindi: "hi",
        hi: "hi",
        hinglish: "hinglish",
        "hindi-english": "hinglish",
        mixed: "hinglish",
      };

      return languageMap[detected] || "en";
    } catch (error) {
      console.error("Language detection error:", error.message);
      return "en";
    }
  }

  async summarizeConversation(history) {
    try {
      if (!history || history.length === 0) return "No conversation to summarize.";

      const conversationText = history
        .map((entry) => `User: ${entry.userInput}\nAI: ${entry.aiResponse}`)
        .join("\n\n");

      const prompt = `Please provide a brief summary of the following conversation in 2-3 sentences:\n\n${conversationText}\n\nSummary:`;

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 200 },
        },
        { timeout: 15000, headers: { "Content-Type": "application/json" } }
      );

      return (
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text.trim() ||
        "Unable to generate summary."
      );
    } catch (error) {
      console.error("Summarization error:", error.message);
      return "Unable to generate summary.";
    }
  }

  async getSuggestions(context, language = "en") {
    try {
      const prompt = `Based on the conversation context, suggest 3 natural follow-up questions or responses in ${this.getLanguageName(
        language
      )}:\n\nContext: ${context}\n\nSuggestions:`;

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 150 },
        },
        { timeout: 10000, headers: { "Content-Type": "application/json" } }
      );

      const suggestions =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return suggestions
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 3);
    } catch (error) {
      console.error("Suggestion generation error:", error.message);
      return [];
    }
  }

  async healthCheck() {
    await this.testConnection();
    return this.connected;
  }
}

module.exports = GeminiService;
