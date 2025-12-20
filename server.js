import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

const apiKey = process.env.GEMINI_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const localAssistantUrl =
  process.env.LOCAL_ASSISTANT_URL || "http://localhost:8000/generate";
console.log("=== Server Startup ===");
console.log("API Key present:", !!apiKey);
console.log(
  "API Key starts with:",
  apiKey ? apiKey.substring(0, 10) + "..." : "NOT SET"
);
console.log("Anthropic Key present:", !!anthropicKey);

const genAI = new GoogleGenerativeAI(apiKey);

app.post("/api/gemini:generate", async (req, res) => {
  try {
    const {
      model: modelName,
      contents,
      generationConfig,
      tools,
      systemInstruction,
    } = req.body;

    console.log("=== Gemini API Request ===");
    console.log("Model:", modelName || "gemini-pro");
    console.log("API Key available:", !!apiKey);
    console.log("Contents length:", contents?.length);
    console.log(
      "Contents preview:",
      JSON.stringify(contents?.slice(0, 2), null, 2)
    );
    // If the requested model is an Anthropic/Claude model, route to Anthropic API
    if (modelName && modelName.toLowerCase().startsWith("claude")) {
      // If the requested model is a local assistant, proxy to the configured local endpoint
      if (
        modelName === "local-assistant" ||
        (modelName && modelName.toLowerCase().startsWith("local:"))
      ) {
        try {
          console.log(
            "Routing request to local assistant at",
            localAssistantUrl
          );

          // If callers used modelName like 'local:my-assistant', include that name in the body
          const localBody = {
            model: modelName,
            contents,
            generationConfig,
            systemInstruction,
          };

          const localRes = await fetch(localAssistantUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localBody),
          });

          const localData = await localRes.json();

          // Expect local server to return either { candidates: [...] } or { text: '...' }
          if (localData.candidates) {
            return res.json(localData);
          }

          const text = localData.text || localData.completion || "";
          return res.json({
            candidates: [{ content: { parts: [{ text }], role: "assistant" } }],
          });
        } catch (err) {
          console.error("Error calling local assistant:", err);
          return res
            .status(500)
            .json({ error: "Local assistant request failed." });
        }
      }

      if (!anthropicKey) {
        console.error("Anthropic API key not set but Claude model requested");
        return res
          .status(500)
          .json({ error: "Anthropic API key not configured on server." });
      }

      // Convert the Google-style contents array into a single prompt string suitable for Anthropic
      const buildText = (items) => {
        return (
          items
            .map((c) => {
              const roleLabel =
                c.role === "user"
                  ? "Human"
                  : c.role === "model"
                  ? "Assistant"
                  : c.role || "System";
              const partText = (c.parts || [])
                .map((p) => p.text || "")
                .join("\n");
              return `${roleLabel}: ${partText}`;
            })
            .join("\n") + "\nAssistant:"
        );
      };

      const prompt = buildText(contents || []);

      const anthropicBody = {
        model: modelName,
        prompt,
        max_tokens_to_sample: generationConfig?.maxOutputTokens || 1024,
        temperature: generationConfig?.temperature ?? 0.0,
      };

      const anthRes = await fetch("https://api.anthropic.com/v1/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
        },
        body: JSON.stringify(anthropicBody),
      });

      const anthData = await anthRes.json();

      // Anthropic returns a `completion` field (string). Normalize to the same response shape.
      const completionText =
        anthData.completion || anthData.completion?.content || "";

      const candidates = [
        {
          content: {
            parts: [{ text: completionText }],
            role: "assistant",
          },
        },
      ];

      return res.json({ candidates });
    }

    // Default: use Google Generative AI
    const model = genAI.getGenerativeModel({
      model: modelName || "models/gemini-1.0-pro",
      generationConfig,
      tools,
      systemInstruction,
    });

    const result = await model.generateContent(contents);
    const response = await result.response;

    // Handle different response types
    const candidates = [];
    if (response.candidates) {
      for (const candidate of response.candidates) {
        const parts = [];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              parts.push({ text: part.text });
            } else if (part.functionCall) {
              parts.push({ functionCall: part.functionCall });
            } else if (part.inlineData) {
              parts.push({ inlineData: part.inlineData });
            }
          }
        }
        candidates.push({
          content: {
            parts,
            role: candidate.content?.role,
          },
          finishReason: candidate.finishReason,
          groundingMetadata: candidate.groundingMetadata,
        });
      }
    }

    console.log("=== Gemini API Success ===");
    res.json({
      candidates,
      error: response.error ? { message: response.error.message } : undefined,
    });
  } catch (error) {
    console.error("=== Gemini API Error ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Serve the React app for any non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(3002, () => {
  console.log("Server running on http://localhost:3002");
});
