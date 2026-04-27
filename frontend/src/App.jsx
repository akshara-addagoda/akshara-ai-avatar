import { useState } from "react";
import AvatarViewer from "./components/AvatarViewer";

const API_URL = "http://localhost:5001";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleAsk = async () => {
    if (!message.trim()) return;

    const userMsg = { type: "user", text: message };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const data = await res.json();

      const botMsg = {
        type: "bot",
        text: data.reply,
        audio: data.audioUrl
      };

      setMessages((prev) => [...prev, botMsg]);

      // 🔊 AUDIO + SPEAKING CONTROL
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);

        setIsSpeaking(true);

        audio.play();

        audio.onended = () => {
          setIsSpeaking(false);
        };
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Akshara AI Avatar 🤖</h1>

      {/* 🤖 Avatar */}
      <div style={{ width: "100%", height: "300px" }}>
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

            {msg.audio && (
              <audio controls src={msg.audio} style={{ marginTop: "5px" }} />
            )}
          </div>
        ))}

        {loading && <p style={{ color: "gray" }}>Thinking...</p>}
      </div>

      {/* ✏️ Input */}
      <div style={styles.inputBox}>
        <input
          style={styles.input}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something..."
        />
        <button style={styles.button} onClick={handleAsk}>
          Send
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
    border: "none"
  },
  button: {
    padding: "10px 15px",
    marginLeft: "10px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  }
};

export default App;