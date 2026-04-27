import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

// 📁 Create audio folder
const audioDir = path.join(process.cwd(), "audio");
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}

// 🎧 Serve audio
app.use("/audio", express.static(audioDir));

// ✅ Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 💬 Chat API
app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    console.log("🔥 User:", message);

    // 🧠 OpenRouter AI
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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

You are preparing for IT placements with a goal of building a strong career in software development and securing a good opportunity in the IT industry. You are interested in Artificial Intelligence, Machine Learning, and Web Development.

You have worked on projects such as:
- AI Avatar Web Application using OpenRouter and ElevenLabs
- Real-Time Sign Language to Text and Speech Conversion using CNN, Mediapipe, OpenCV
- Autism Risk Screening System using Machine Learning and Quantum ML
- Jarvis AI Voice Assistant using Python

You also have experience as a Database Developer at MK Logistics where you:
- Designed relational databases
- Worked with PostgreSQL and Supabase
- Optimized SQL queries and handled real-time data

Your technical skills include:
- Java, Python, C
- HTML, CSS, JavaScript, React, Node.js
- AI/ML: CNN, Deep Learning, Computer Vision
- Tools: Git, GitHub, VS Code
- Cloud: AWS and Google Cloud (basic knowledge)

Beyond technical skills, you are:
- A writer who enjoys expressing thoughts and ideas
- A photographer and core member of Click Cadets photography club
- Someone who enjoys cooking

Your journey includes overcoming challenges, including a break after 12th due to hip joint surgery, which made you stronger and more determined.

Your personality:
- Honest and grounded
- Calm, thoughtful, and self-aware
- Curious and always learning
- Quietly confident

Communication style:
- Simple and clear English
- Structured answers (like interviews)
- Use real examples from projects
- Avoid exaggeration or fake claims

Rules:
- Keep answers concise and relevant
- Focus on practical knowledge
- If unsure, say you are learning it
- Avoid generic textbook answers

Your goal:
- To present yourself as a capable fresher ready for real-world software roles
- To impress interviewers with clarity, honesty, and practical experience
`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const aiData = await aiRes.json();

    const reply =
      aiData?.choices?.[0]?.message?.content || "No response";

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

    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      console.error("❌ TTS ERROR:", err);
      return res.status(500).json({ error: "TTS failed", details: err });
    }

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());

    // 💾 Save audio
    const fileName = `audio-${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);

    fs.writeFileSync(filePath, audioBuffer);

    console.log("🔊 Audio saved:", fileName);

    // 📤 Send response
    res.json({
      reply,
      audioUrl: `http://localhost:${port}/audio/${fileName}`
    });

  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 🚀 Start server
app.listen(port, () => {
  console.log(`🚀 Backend running at http://localhost:${port}`);
});