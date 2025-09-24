import { useState, useEffect, useRef } from "react";
import "./App.css";

interface Message {
  user: string;
  text: string;
  type: "message" | "notification";
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const randomName = `User${Math.floor(Math.random() * 1000)}`;
    setCurrentUser(randomName);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const url = new URL(tabs[0].url);
        const host = url.hostname;
        setCurrentUrl(host);
      }
    });
  }, []);

  useEffect(() => {
    if (!currentUrl || !currentUser) return;

    ws.current = new WebSocket("ws://localhost:8080");

    ws.current.onopen = () => {
      console.log("Connected to WebSocket server");
      ws.current?.send(
        JSON.stringify({
          type: "join",
          payload: { url: currentUrl, name: currentUser },
        })
      );
    };

    ws.current.onmessage = (event) => {
      const receivedMessage = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, receivedMessage]);
    };

    ws.current.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    return () => {
      ws.current?.close();
    };
  }, [currentUrl, currentUser]);

  const sendMessage = () => {
    if (input.trim() && ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: "message",
        payload: { user: currentUser, text: input },
      };
      ws.current.send(JSON.stringify(message));
      setInput("");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h3>Chat for: {currentUrl}</h3>
        <p>Your Name: {currentUser}</p>
      </header>
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
