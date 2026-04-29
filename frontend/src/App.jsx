import { useState, useRef, useEffect } from "react";
import AvatarViewer from "./components/AvatarViewer";

// 🔥 IMPORTANT: replace with YOUR Render backend URL
const API_URL = "https://akshara-ai-avatar.onrender.com";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listening, setListening] = useState(false);

  const audioRef = useRef(null);
  const chatEndRef = useRef(null);

  // 🔥 Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🎤 MIC INPUT
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    setListening(true);
    setMessage("🎤 Listening...");

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setMessage(text);
      setListening(false);

      setTimeout(() => {
        handleAsk(text);
      }, 300);
    };

    recognition.onerror = () => {
      setListening(false);
      setMessage("");
    };

    recognition.start();
  };

  // 🤖 ASK AI
  const handleAsk = async (inputText) => {
    const finalMessage = inputText || message;
    if (!finalMessage.trim()) return;

    const userMsg = { type: "user", text: finalMessage };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: finalMessage })
      });

      const data = await res.json();

      // 🔊 AUDIO HANDLING
      if (data.audioUrl) {
        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(data.audioUrl);
        audioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);

        audio.play();
      }

      // ✨ TYPING EFFECT
      let i = 0;
      const fullText = data.reply;

      const botMsg = { type: "bot", text: "" };
      setMessages((prev) => [...prev, botMsg]);

      const interval = setInterval(() => {
        i++;
        botMsg.text = fullText.slice(0, i);

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...botMsg };
          return updated;
        });

        if (i >= fullText.length) {
          clearInterval(interval);
        }
      }, 20);

    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Akshara AI Avatar 🤖</h1>

      {/* 🤖 Avatar */}
      <div style={styles.avatar}>
        <AvatarViewer isSpeaking={isSpeaking} />
      </div>

      {/* 💬 Chat */}
      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf: msg.type === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.type === "user" ? "#4CAF50" : "#333"
            }}
          >
            {msg.text}
          </div>
        ))}

        {loading && <p style={{ color: "gray" }}>Thinking...</p>}
        <div ref={chatEndRef} />
      </div>

      {/* ✏️ Input */}
      <div style={styles.inputBox}>
        <input
          style={styles.input}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something..."
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
        />

        <button style={styles.button} onClick={() => handleAsk()}>
          Send
        </button>

        <button
          style={{
            ...styles.micButton,
            background: listening ? "red" : "#2196F3"
          }}
          onClick={startListening}
        >
          🎤
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    background: "#121212",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px"
  },
  title: {
    marginBottom: "10px"
  },
  avatar: {
    width: "100%",
    height: "320px"
  },
  chatBox: {
    flex: 1,
    width: "100%",
    maxWidth: "600px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    overflowY: "auto",
    padding: "10px",
    borderRadius: "10px",
    background: "#1e1e1e"
  },
  message: {
    padding: "10px",
    borderRadius: "10px",
    maxWidth: "70%"
  },
  inputBox: {
    display: "flex",
    width: "100%",
    maxWidth: "600px",
    marginTop: "10px"
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "none",
    outline: "none"
  },
  button: {
    padding: "10px 15px",
    marginLeft: "10px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  },
  micButton: {
    padding: "10px",
    marginLeft: "5px",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  }
};

export default App;