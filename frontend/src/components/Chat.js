import React, { useState, useEffect, useRef } from "react";
import { secureApiCall } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  PaperAirplaneIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/solid";

const Chat = () => {
  const { userId } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState({}); // Stocke les utilisateurs qui tapent
  const [typingDots, setTypingDots] = useState(""); // Animation des points
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  let typingTimeout = useRef(null);

  // Connexion WebSocket
  const connectWebSocket = (chatId) => {
    if (socket.current) {
      socket.current.close();
    }

    socket.current = new WebSocket(`ws://localhost:8000/chat/ws/${chatId}`);

    socket.current.onopen = () => {
      console.log("WebSocket connecté");
    };

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if ("typing" in data) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.user_id]: data.typing ? data.username : null,
        }));
      } else {
        setMessages((prev) => [...prev, data]);
        scrollToBottom();
      }
    };

    socket.current.onclose = () => {
      console.log("WebSocket fermé");
    };
  };

  // Récupération des conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await secureApiCall("/chat/conversations");
        setConversations(response);
      } catch (error) {
        console.error("Erreur lors de la récupération des conversations :", error);
      }
    };
    fetchConversations();
  }, []);

  // Récupération des messages de la conversation sélectionnée
  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        try {
          const response = await secureApiCall(`/chat/messages/${selectedChat.id}`);
          setMessages(response);
          scrollToBottom();
          connectWebSocket(selectedChat.id);
        } catch (error) {
          console.error("Erreur lors de la récupération des messages :", error);
        }
      };
      fetchMessages();
    }
  }, [selectedChat]);

  // Animation des points "..."
  useEffect(() => {
    const dotsArray = ["", ".", "..", "..."];
    let index = 0;
    const interval = setInterval(() => {
      setTypingDots(dotsArray[index]);
      index = (index + 1) % dotsArray.length;
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Envoi d'un message via API
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      sender_id: userId,
      chat_id: selectedChat.id,
      content: newMessage,
    };

    try {
      await secureApiCall("/chat/send", "POST", messageData);
      setNewMessage("");
      scrollToBottom();
      notifyTyping(false);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
    }
  };

  // Détection de la saisie
  const handleTyping = (event) => {
    setNewMessage(event.target.value);
    if (!selectedChat) return;

    // Déclenche la notification de frappe uniquement s'il y a du texte
    const isTyping = event.target.value.trim().length > 0;
    notifyTyping(isTyping);

    // Empêche l'envoi trop fréquent de notifications
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      notifyTyping(false);
    }, 3000);
  };

  // Fonction pour envoyer la notification de frappe
  const notifyTyping = (isTyping) => {
    secureApiCall("/chat/typing", "POST", {
      chat_id: selectedChat.id,
      is_typing: isTyping,
    });
  };

  // Gestion de l'envoi via Enter
  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // Fonction pour scroller vers le bas
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Liste des discussions */}
      <div className="w-1/3 border-r border-gray-700 overflow-y-auto p-4">
        <h2 className="text-xl font-bold mb-4">Discussions</h2>
        {conversations.map((chat) => (
          <div
            key={chat.id}
            className={`flex items-center gap-4 p-3 rounded-md cursor-pointer 
              ${selectedChat?.id === chat.id ? "bg-gray-800" : "hover:bg-gray-700"}`}
            onClick={() => setSelectedChat(chat)}
          >
            <img
              src={chat.avatar || "https://via.placeholder.com/50"}
              alt={chat.name}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <p className="font-semibold">{chat.name}</p>
              <p className={`text-sm ${chat.isOnline ? "text-green-500" : "text-gray-400"}`}>
                {chat.isOnline ? "Connecté" : "Déconnecté"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Fenêtre de chat */}
      <div className="w-2/3 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">{selectedChat.name}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto relative" style={{ maxHeight: "calc(100vh - 120px)" }}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`max-w-xs break-words p-3 rounded-md mb-2 
                    ${msg.sender_id === userId ? "bg-red-500 ml-auto" : "bg-gray-700 mr-auto"}`}
                >
                  {msg.content}
                </div>
              ))}

              {/* Indicateur de saisie (en bas à gauche) */}
              {Object.values(typingUsers).filter(Boolean).map((username, index) => (
                <div key={index} className="absolute bottom-4 left-4 text-gray-400 text-sm">
                  {username} est en train d'écrire{typingDots}
                </div>
              ))}

              {/* Référence pour scroller vers le dernier message */}
              <div ref={messagesEndRef}></div>
            </div>

            {/* Barre de saisie */}
            <div className="p-4 flex items-center border-t border-gray-700">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={handleKeyPress}
                placeholder="Tapez votre message..."
                className="flex-1 bg-transparent border border-gray-600 rounded-md p-2 focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="ml-4 bg-red-500 hover:bg-red-600 p-2 rounded-md"
              >
                <PaperAirplaneIcon className="w-6 h-6 text-white" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <ChatBubbleOvalLeftEllipsisIcon className="w-20 h-20 text-gray-500" />
            <p className="ml-4 text-gray-400">Sélectionnez une discussion</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;