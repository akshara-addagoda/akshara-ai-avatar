import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

dotenv.config();

const app = express();

// ✅ Render dynamic port
const port = process.env.PORT || 5001;

// ✅ CORS
app.use(cors());

// ✅ JSON parsing
app.use(express.json());

// 📁 Create audio folder
const audioDir = path.join(process.cwd(), "audio");

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}

// 🎧 Serve audio files
app.use("/audio", express.static(audioDir));

// ✅ Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// 💬 Chat API
app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({
        error: "Message required"
      });
    }

    console.log("🔥 User:", message);

    // 🧠 OpenRouter AI Request
    const aiRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct",

          messages: [
            {
              role: "system",

              content: `
You are Akshara Addagoda, a B.Tech Information Technology student from Hyderabad, India.

You are preparing for IT placements with a goal of building a strong career in software development and securing a good opportunity in the IT industry.

You are interested in:
- Artificial Intelligence
- Machine Learning
- Web Development

Projects:
- AI Avatar Web Application using OpenRouter and ElevenLabs
- Real-Time Sign Language to Text and Speech Conversion
- Autism Risk Screening System using Machine Learning
- Jarvis AI Voice Assistant using Python

Skills:
- Java
- Python
- C
- HTML
- CSS
- JavaScript
- React
- Node.js
- CNN
- Deep Learning
- Computer Vision
- Git & GitHub

Personality:
- Honest
- Calm
- Curious
- Practical
- Grounded

Communication style:
- Clear English
- Concise answers
- Real examples
- No exaggeration
`
            },

            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    // ❌ OPENROUTER ERROR
    if (!aiRes.ok) {
      const err = await aiRes.text();

      console.error("❌ OpenRouter Error:", err);

      return res.status(500).json({
        error: "OpenRouter failed",
        details: err
      });
    }

    const aiData = await aiRes.json();

    const reply =
      aiData?.choices?.[0]?.message?.content ||
      "No response";

    console.log("✅ AI Reply:", reply);

    // 🔊 ElevenLabs TTS
    const ttsRes = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL",
      {
        method: "POST",

        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg"
        },

        body: JSON.stringify({
          text: reply,
          model_id: "eleven_multilingual_v2"
        })
      }
    );

    // ❌ TTS ERROR
    if (!ttsRes.ok) {
      const err = await ttsRes.text();

      console.error("❌ ElevenLabs Error:", err);

      return res.status(500).json({
        error: "TTS failed",
        details: err
      });
    }

    // 🔊 Convert audio buffer
    const audioBuffer = Buffer.from(
      await ttsRes.arrayBuffer()
    );

    // 💾 Save audio
    const fileName = `audio-${Date.now()}.mp3`;

    const filePath = path.join(
      audioDir,
      fileName
    );

    fs.writeFileSync(filePath, audioBuffer);

    console.log("🔊 Audio saved:", fileName);

    // ✅ Send response
    res.json({
      reply,

      // ✅ IMPORTANT FIX
      audioUrl: `${req.protocol}://${req.get(
        "host"
      )}/audio/${fileName}`
    });

  } catch (error) {
    console.error("❌ Server Error:", error);

    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

// 🚀 Start server
app.listen(port, () => {
  console.log(`🚀 Backend running on port ${port}`);
});