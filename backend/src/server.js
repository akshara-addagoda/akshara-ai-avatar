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

// ✅ Middleware
app.use(cors());
app.use(express.json());

// 📁 Create audio folder
const audioDir = path.join(process.cwd(), "audio");

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}

// 🎧 Serve audio
app.use("/audio", express.static(audioDir));

// ✅ Health Check
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

    // 🧠 OpenRouter Request
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

You are interested in:
- AI
- Machine Learning
- Web Development

Projects:
- AI Avatar Web Application
- Sign Language to Text & Speech
- Jarvis AI Assistant
- Autism Risk Screening

Skills:
- Java
- Python
- React
- Node.js
- CNN
- Deep Learning

Communication style:
- Simple English
- Clear answers
- Honest responses
- Practical examples
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

    // ❌ OpenRouter Error
    if (!aiRes.ok) {
      const err = await aiRes.text();

      console.error("❌ OpenRouter Error:", err);

      return res.status(500).json({
        error: "OpenRouter failed",
        details: err
      });
    }

    // ✅ Parse AI Response
    const aiData = await aiRes.json();

    const reply =
      aiData?.choices?.[0]?.message?.content ||
      "No response";

    console.log("✅ AI Reply:", reply);

    // ✅ TEXT RESPONSE ONLY
    res.json({
      reply,
      audioUrl: null
    });

  } catch (error) {
    console.error("❌ Server Error:", error);

    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

// 🚀 Start Server
app.listen(port, () => {
  console.log(`🚀 Backend running on port ${port}`);
});