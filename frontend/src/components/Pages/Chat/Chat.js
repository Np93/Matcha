import React, { useState, useEffect, useRef } from "react";
import { secureApiCall } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import {
  PaperAirplaneIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/solid";
// import VideoCall from "./VideoCall";

const Chat = () => {
  const { userId } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [typingDots, setTypingDots] = useState("");
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  // const [receiverId, setReceiverId] = useState(null);
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

      if (data.event === "typing") {
        setTypingUsers((prev) => {
          const updatedUsers = new Set(prev);
          if (data.typing) {
            updatedUsers.add(data.username);
          } else {
            updatedUsers.delete(data.username);
          }
          return new Set(updatedUsers);
        });
      } else {
        setMessages((prev) => [...prev, data]);
        scrollToBottom();
      }
    };

    socket.current.onclose = () => {
      console.log("WebSocket fermé");
    };
  };

  //  **Fermeture propre de la WebSocket lorsque l'on quitte le chat**
  useEffect(() => {
    return () => {
      if (socket.current) {
        console.log("Fermeture de la WebSocket...");
        socket.current.close();
      }
    };
  }, []);

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

  // Récupération des messages et connexion WebSocket
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
    } else {
      // 🔴 Fermer la WebSocket si l'utilisateur quitte la conversation
      if (socket.current) {
        console.log("Fermeture de la WebSocket car plus de chat sélectionné...");
        socket.current.close();
      }
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

  // Envoi d'un message
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

    const isTyping = event.target.value.trim().length > 0;
    notifyTyping(isTyping);
  };

  // Notification de frappe
  const notifyTyping = async (isTyping) => {
    try {
      await secureApiCall("/chat/typing", "POST", {
        chat_id: selectedChat.id,
        is_typing: isTyping,
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi du typing status:", error);
    }
  };

  // Envoi avec Enter
  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // Scroll automatique
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // formater l'heure
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Liste des conversations */}
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
      <div className="w-2/3 flex flex-col relative">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">{selectedChat.name}</h2>
              {/* Bouton pour ouvrir la vidéo */}
              {/* <VideoCall chatId={selectedChat.id} /> */}
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto relative">
              {messages.map((msg, index) => (
                <div key={index} className={`max-w-xs break-words p-3 rounded-md mb-2 
                    ${msg.sender_id === userId ? "bg-red-500 ml-auto" : "bg-gray-700 mr-auto"}`}>
                  <span className="text-left">{msg.content}</span>
                  {/* Heure bien attachée au bas droit de la bulle */}
                  <div className="flex justify-end mt-0.5">
                    <span className="text-[10px] text-gray-300">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>

            {/* Barre de saisie + Indicateur de frappe */}
            <div className="p-4 border-t border-gray-700">
              {typingUsers.size > 0 && (
                <div className="text-gray-400 text-sm mb-1">
                  {Array.from(typingUsers).join(", ")} est en train d'écrire{typingDots}
                </div>
              )}

              <div className="flex items-center">
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
            </div>
          </>
        ) : <p>Sélectionnez une conversation</p>}
      </div>
    </div>
  );
};

export default Chat;