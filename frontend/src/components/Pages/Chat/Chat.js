import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { secureApiCall } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import VideoCall from "./utils/VideoCall";
import DatePlanner from "./utils/DatePlanner";

const Chat = () => {
  const { userId } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [typingDots, setTypingDots] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showChatView, setShowChatView] = useState(false);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const [showDateModal, setShowDateModal] = useState(false);
  const [latestDateStatus, setLatestDateStatus] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      if (!isMobile) setShowChatView(true); // toujours afficher les 2 parties sur desktop
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => () => socket.current?.close(), []);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await secureApiCall("/chat/conversations");
        setConversations(response);
      } catch (error) {
        console.error("Erreur conversations :", error);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    const dotsArray = ["", ".", "..", "..."];
    let index = 0;
    const interval = setInterval(() => {
      setTypingDots(dotsArray[index]);
      index = (index + 1) % dotsArray.length;
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      const fetchMessagesAndStatus = async () => {
        try {
          const [messagesRes, statusRes] = await Promise.all([
            secureApiCall(`/chat/messages/${selectedChat.id}`),
            secureApiCall(`/chat/date_invite/status?chat_id=${selectedChat.id}`, "GET"),
          ]);
          setMessages(messagesRes);
          scrollToBottom();
          connectWebSocket(selectedChat.id);

          if (statusRes?.status) {
            setLatestDateStatus(statusRes.status);
          } else {
            // Fallback : regarder dans les messages
            const lastDateInvite = [...messagesRes].reverse().find(msg => msg.type === "date_invite");
            if (lastDateInvite) {
              setLatestDateStatus(lastDateInvite.status);
            } else {
              setLatestDateStatus(null);
            }
          }
        } catch (error) {
          console.error("Erreur récupération messages/statut :", error);
        }
      };

      fetchMessagesAndStatus();
    } else if (socket.current) {
      socket.current.close();
    }
  }, [selectedChat]);

  const connectWebSocket = (chatId) => {
    if (socket.current) socket.current.close();
    socket.current = new WebSocket(`wss://${window.location.host}/chat/ws/${chatId}`);
    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "typing") {
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          data.typing ? updated.add(data.username) : updated.delete(data.username);
          return new Set(updated);
        });
      } else if (data.type === "date_result") {
        // Affichage direct dans le chat sous forme de message système
        const dateMessage = {
          sender_id: 0, // 0 = système
          content: data.message,
          type: "system",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, dateMessage]);
      } else {
        setMessages((prev) => [...prev, data]);
        if (data.type === "date_invite") {
          setLatestDateStatus(data.status);
        }
        scrollToBottom();
      }
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const data = { sender_id: userId, chat_id: selectedChat.id, content: newMessage };
    try {
      await secureApiCall("/chat/send", "POST", data);
      setNewMessage("");
      scrollToBottom();
      notifyTyping(false);
    } catch (err) {
      console.error("Erreur envoi message :", err);
    }
  };

  const notifyTyping = async (isTyping) => {
    try {
      await secureApiCall("/chat/typing", "POST", {
        chat_id: selectedChat.id,
        is_typing: isTyping,
      });
    } catch (err) {
      console.error("Erreur typing :", err);
    }
  };

  const handleDateResponse = async (accepted) => {
    await secureApiCall("/chat/date_invite/respond", "POST", {
      chat_id: selectedChat.id,
      accepted,
    });
    if (accepted) setShowDateModal(true);
  };

  const scrollToBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    if (isMobileView) setShowChatView(true);
  };

  return (
    <div className="flex h-screen flex-col md:flex-row bg-gray-900 text-white overflow-hidden">
      {/* Conversations list */}
      {(!isMobileView || !showChatView) && (
        <div className="md:w-1/3 w-full md:border-r border-gray-800 bg-gray-950 overflow-y-auto p-4 space-y-3 max-h-[50vh] md:max-h-full">
          <h2 className="text-lg font-bold mb-2">Discussions</h2>
          <div className="space-y-2">
            {conversations.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedChat?.id === chat.id ? "bg-gray-800" : "hover:bg-gray-800"
                }`}
                onClick={() => handleSelectChat(chat)}
              >
                <img
                  src={chat.avatar || "/images/avatar-default.png"}
                  alt={chat.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-semibold">{chat.name}</p>
                  <p
                    className={`text-sm ${
                      chat.isOnline ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    {chat.isOnline ? "Connecté" : "Déconnecté"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat section */}
      {(!isMobileView || showChatView) && (
        <div className="flex flex-col flex-1 h-full">
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950 flex-wrap gap-4 sm:gap-6">
                <div
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                  onClick={() =>
                    navigate(`/profile/${selectedChat.username}`, {
                      state: { userId: selectedChat.other_user_id },
                    })
                  }
                >
                  <img
                    src={selectedChat.avatar || "/images/avatar-default.png"}
                    alt={selectedChat.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-gray-700"
                  />
                  <h2 className="text-base sm:text-lg font-semibold truncate max-w-[150px] sm:max-w-xs">
                    {selectedChat.name}
                  </h2>
                </div>

                <button
                  onClick={async () => {
                    if (latestDateStatus === "accepted") {
                      setShowDateModal(true);
                      return;
                    }

                    try {
                      const res = await secureApiCall("/chat/date_invite", "POST", { chat_id: selectedChat.id });
                      if (res?.ok) {
                        setLatestDateStatus("pending");
                      }
                    } catch (err) {
                      if (err?.response?.data?.detail === "Une invitation est déjà en cours") {
                        // Réaffiche l’invitation
                        const statusRes = await secureApiCall(`/chat/date_invite/status?chat_id=${selectedChat.id}`, "GET");
                        if (statusRes?.status) {
                          setLatestDateStatus(statusRes.status);
                        }
                      } else {
                        console.error("Erreur invitation date :", err);
                      }
                    }
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm"
                >
                  💌 Date
                </button>

                <VideoCall
                  userId={userId}
                  chatId={selectedChat.id}
                  otherUserId={selectedChat.other_user_id}
                />
              </div>

              {/* Retour mobile */}
              {isMobileView && (
                <button
                  onClick={() => setShowChatView(false)}
                  className="bg-gray-800 text-white p-2 text-sm border-b border-gray-700"
                >
                  ← Retour aux discussions
                </button>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg, index) => {
                  const isSystem = msg.type === "system" || msg.type === "date_result";
                  const isMe = msg.sender_id === userId;

                  return (
                    <div
                      key={index}
                      className={
                        isSystem
                          ? "w-full flex justify-center"
                          : `max-w-[75%] p-3 rounded-lg text-sm break-words ${
                              isMe ? "bg-red-500 ml-auto" : "bg-gray-700 mr-auto"
                            }`
                      }
                    >
                      {msg.type === "date_invite" ? (
                        <div className="text-white">
                          <p><strong>{msg.sender_name}</strong> vous invite à planifier un rendez-vous !</p>

                          {msg.status === "pending" && msg.sender_id !== userId && (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handleDateResponse(true)}
                                className="bg-green-600 px-3 py-1 rounded"
                              >
                                Accepter
                              </button>
                              <button
                                onClick={() => handleDateResponse(false)}
                                className="bg-red-600 px-3 py-1 rounded"
                              >
                                Refuser
                              </button>
                            </div>
                          )}
                          {msg.status === "accepted" && <p className="mt-2 italic">Invitation acceptée. Proposez vos créneaux !</p>}
                          {msg.status === "declined" && <p className="mt-2 italic">Invitation refusée.</p>}
                        </div>
                      ) : isSystem ? (
                        <div className="bg-yellow-600 text-white text-sm italic px-4 py-2 rounded-md text-center max-w-md">
                          {msg.content}
                        </div>
                      ) : (
                        <>
                          {msg.content}
                          <div className="text-[10px] text-right text-gray-300 mt-1">
                            {!isNaN(new Date(msg.timestamp))
                              ? new Date(msg.timestamp).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "🕒"}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef}></div>
                  {showDateModal && (
                  <DatePlanner
                    chatId={selectedChat.id}
                    onClose={() => setShowDateModal(false)}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800 bg-gray-950">
                {typingUsers.size > 0 && (
                  <p className="text-gray-400 text-sm mb-1">
                    {Array.from(typingUsers).join(", ")} écrit{typingDots}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Tapez un message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      notifyTyping(e.target.value.trim().length > 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-red-600 hover:bg-red-700 p-2 rounded-full"
                  >
                    <PaperAirplaneIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Sélectionnez une conversation
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;