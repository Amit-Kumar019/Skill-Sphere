import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { io, Socket } from "socket.io-client";
import { 
  Send, Paperclip, Search, MessageSquare, 
  User, Briefcase, FileText, ArrowLeft, Loader2 
} from "lucide-react";

interface Attachment {
  url: string;
  public_id: string;
}

interface Participant {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: {
    url: string;
  };
  role: "client" | "freelancer" | "admin";
}

interface Message {
  _id: string;
  chat: string;
  sender: Participant;
  message: string;
  attachments?: Attachment[];
  isRead: boolean;
  createdAt: string;
}

interface Chat {
  _id: string;
  participants: Participant[];
  gig?: {
    _id: string;
    title: string;
    budget: { min: number; max: number };
    status: string;
  };
  lastMessage?: Message;
  updatedAt: string;
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChatIdFromUrl = searchParams.get("chatId");

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState<{ userId: string; userName: string } | null>(null);
  const [chatSearch, setChatSearch] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const activeChatIdRef = useRef<string | null>(activeChatIdFromUrl);

  // Initialize socket
  useEffect(() => {
    if (!user) return;

    // Establish connection to backend server
    const socket: Socket = io(window.location.origin, {
      query: { userId: user._id }
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to websocket server");
      socket.emit("join_user", user._id);
    });

    socket.on("new_message", (message: Message) => {
      // Append if it belongs to active chat
      if (message.chat === activeChatIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });
        // Auto scroll to bottom
        setTimeout(() => {
          messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }

      // Update chats list with new last message
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat._id === message.chat) {
            return {
              ...chat,
              lastMessage: message,
              updatedAt: new Date().toISOString()
            };
          }
          return chat;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    });

    socket.on("typing", (data: { chatId: string; userId: string; userName: string }) => {
      if (data.chatId === activeChatIdRef.current && data.userId !== user._id) {
        setOtherUserTyping({ userId: data.userId, userName: data.userName });
      }
    });

    socket.on("stop_typing", (data: { chatId: string; userId: string }) => {
      if (data.chatId === activeChatIdRef.current && data.userId !== user._id) {
        setOtherUserTyping(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Join chat room on activeChatId change
  useEffect(() => {
    activeChatIdRef.current = activeChatIdFromUrl;
    if (socketRef.current && activeChatIdFromUrl) {
      socketRef.current.emit("join_chat", activeChatIdFromUrl);
      setOtherUserTyping(null);
    }
  }, [activeChatIdFromUrl]);

  // Fetch all user chats
  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const res = await fetch("/api/v1/chat", { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) {
        setChats(json.data);
        
        // Set active chat if matching URL parameter
        if (activeChatIdFromUrl) {
          const match = json.data.find((c: Chat) => c._id === activeChatIdFromUrl);
          if (match) setActiveChat(match);
        }
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [activeChatIdFromUrl]);

  // Fetch messages when activeChat changes
  const fetchMessages = async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/v1/chat/${chatId}/messages`, { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) {
        setMessages(json.data);
        setTimeout(() => {
          messageEndRef.current?.scrollIntoView({ behavior: "auto" });
        }, 50);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeChatIdFromUrl) {
      fetchMessages(activeChatIdFromUrl);
    } else {
      setActiveChat(null);
      setMessages([]);
    }
  }, [activeChatIdFromUrl]);

  // Scroll to bottom when message list updates
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || (!inputText.trim() && attachments.length === 0)) return;

    setSendingMessage(true);
    // Send stop typing event immediately
    if (socketRef.current) {
      socketRef.current.emit("stop_typing", {
        chatId: activeChat._id,
        userId: user?._id
      });
    }

    try {
      const formData = new FormData();
      if (inputText.trim()) formData.append("message", inputText.trim());
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const res = await fetch(`/api/v1/chat/${activeChat._id}/messages`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === json.data._id)) {
            return prev;
          }
          return [...prev, json.data];
        });
        setInputText("");
        setAttachments([]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Keyboard typing callbacks to trigger typing updates via sockets
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeChat || !user || !socketRef.current) return;

    socketRef.current.emit("typing", {
      chatId: activeChat._id,
      userId: user._id,
      userName: user.firstName
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", {
        chatId: activeChat._id,
        userId: user._id
      });
    }, 2000);
  };

  const getRecipient = (chat: Chat) => {
    return chat.participants.find((p) => p._id !== user?._id);
  };

  const filteredChats = chats.filter((c) => {
    const r = getRecipient(c);
    if (!r) return false;
    const name = `${r.firstName} ${r.lastName} ${r.username}`.toLowerCase();
    const gigTitle = c.gig?.title.toLowerCase() || "";
    const search = chatSearch.toLowerCase();
    return name.includes(search) || gigTitle.includes(search);
  });

  return (
    <div className="auth-wrapper" style={{ minHeight: "100vh", alignItems: "stretch", paddingTop: "40px", paddingBottom: "40px" }}>
      <div className="glass-card" style={{ 
        maxWidth: "1100px", 
        width: "100%",
        padding: 0, 
        display: "flex", 
        flexDirection: "row", 
        overflow: "hidden", 
        borderRadius: "var(--radius-lg)",
        height: "calc(100vh - 80px)",
        alignItems: "stretch"
      }}>
        
        {/* Left Column: Chats List */}
        <div style={{ width: "350px", flexShrink: 0, borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header search bar */}
          <div style={{ padding: "20px", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Link to="/dashboard" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                <ArrowLeft size={18} />
              </Link>
              <h2 style={{ fontSize: "1.3rem" }}>Inbox Messages</h2>
            </div>
            
            <div className="input-wrapper">
              <input
                type="text"
                className="form-input"
                placeholder="Search conversations..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                style={{ paddingLeft: "36px", height: "38px" }}
              />
              <Search className="input-icon" size={15} style={{ left: "12px" }} />
            </div>
          </div>

          {/* List items */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingChats ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <Loader2 className="spinner" size={24} style={{ color: "var(--primary)" }} />
              </div>
            ) : filteredChats.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                <MessageSquare size={32} style={{ marginBottom: "8px", opacity: 0.5, display: "inline-block" }} />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredChats.map((c) => {
                const recipient = getRecipient(c);
                const isActive = c._id === activeChatIdFromUrl;
                if (!recipient) return null;

                return (
                  <div
                    key={c._id}
                    onClick={() => {
                      setSearchParams({ chatId: c._id });
                      setActiveChat(c);
                    }}
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      background: isActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                      borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                      transition: "var(--transition)",
                      display: "flex",
                      gap: "12px",
                      alignItems: "center"
                    }}
                  >
                    {/* User Avatar */}
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--border-color)",
                      overflow: "hidden",
                      flexShrink: 0
                    }}>
                      {recipient.avatar?.url ? (
                        <img src={recipient.avatar.url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <User size={18} style={{ color: "var(--text-muted)" }} />
                      )}
                    </div>

                    {/* Chat details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                        <h4 style={{ fontSize: "0.95rem", color: isActive ? "var(--text-main)" : "var(--text-main)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {recipient.firstName} {recipient.lastName}
                        </h4>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {c.lastMessage ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                      </div>
                      
                      {c.gig && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--secondary)", marginBottom: "4px" }}>
                          <Briefcase size={10} />
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.gig.title}</span>
                        </div>
                      )}

                      <p style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {c.lastMessage ? c.lastMessage.message : "No messages yet"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%", background: "rgba(255,255,255,0.01)" }}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div style={{
                padding: "16px 24px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(20, 18, 33, 0.4)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--border-color)",
                    overflow: "hidden"
                  }}>
                    {getRecipient(activeChat)?.avatar?.url ? (
                      <img src={getRecipient(activeChat)?.avatar?.url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 600 }}>
                      {getRecipient(activeChat)?.firstName} {getRecipient(activeChat)?.lastName}
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                      {getRecipient(activeChat)?.role} &bull; @{getRecipient(activeChat)?.username}
                    </span>
                  </div>
                </div>

                {activeChat.gig && (
                  <Link
                    to={`/gigs/${activeChat.gig._id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(99,102,241,0.06)",
                      border: "1px solid rgba(99,102,241,0.15)",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      color: "var(--primary)"
                    }}
                  >
                    <Briefcase size={12} />
                    <span>View Gig Details</span>
                  </Link>
                )}
              </div>

              {/* Message List */}
              <div style={{ flex: 1, minHeight: 0, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                {loadingMessages ? (
                  <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Loader2 className="spinner" size={28} style={{ color: "var(--primary)" }} />
                  </div>
                ) : (
                  <>
                    {messages.map((m) => {
                      const isOwn = m.sender._id === user?._id;

                      return (
                        <div
                          key={m._id}
                          style={{
                            display: "flex",
                            justifyContent: isOwn ? "flex-end" : "flex-start",
                            width: "100%"
                          }}
                        >
                          <div style={{
                            maxWidth: "70%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isOwn ? "flex-end" : "flex-start"
                          }}>
                            {/* Message Bubble */}
                            <div style={{
                              padding: "12px 16px",
                              borderRadius: "var(--radius-md)",
                              background: isOwn ? "var(--primary)" : "rgba(255,255,255,0.04)",
                              border: isOwn ? "none" : "1px solid var(--border-color)",
                              color: "var(--text-main)",
                              fontSize: "0.92rem",
                              lineHeight: 1.5,
                              whiteSpace: "pre-line",
                              wordBreak: "break-word"
                            }}>
                              {m.message}

                              {/* Message attachments */}
                              {m.attachments && m.attachments.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                                  {m.attachments.map((file, idx) => (
                                    <a
                                      key={idx}
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        fontSize: "0.75rem",
                                        color: isOwn ? "rgba(255,255,255,0.9)" : "var(--secondary)",
                                        textDecoration: "underline"
                                      }}
                                    >
                                      <FileText size={12} /> Attachment #{idx + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Date/Time info */}
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing status notification */}
                    {otherUserTyping && (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--text-muted)", fontSize: "0.8rem", paddingLeft: "4px" }}>
                        <div className="typing-indicator" style={{ display: "flex", gap: "3px" }}>
                          <span style={{ width: "6px", height: "6px", background: "var(--text-muted)", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out" }}></span>
                          <span style={{ width: "6px", height: "6px", background: "var(--text-muted)", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out 0.2s" }}></span>
                          <span style={{ width: "6px", height: "6px", background: "var(--text-muted)", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out 0.4s" }}></span>
                        </div>
                        <span>{otherUserTyping.userName} is typing...</span>
                      </div>
                    )}
                    <div ref={messageEndRef} />
                  </>
                )}
              </div>

              {/* Input Form Box */}
              <form onSubmit={handleSendMessage} style={{
                padding: "20px 24px",
                borderTop: "1px solid var(--border-color)",
                background: "rgba(20, 18, 33, 0.4)"
              }}>
                {attachments.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                    {attachments.map((file, idx) => (
                      <div key={idx} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--border-color)",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        fontSize: "0.75rem"
                      }}>
                        <FileText size={12} style={{ color: "var(--secondary)" }} />
                        <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                        <button type="button" onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  {/* File Upload Selector */}
                  <label style={{ cursor: "pointer", color: "var(--text-muted)", transition: "var(--transition)" }} className="hover-primary">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setAttachments((prev) => [...prev, ...Array.from(e.target.files || [])]);
                        }
                      }}
                      style={{ display: "none" }}
                    />
                    <Paperclip size={20} />
                  </label>

                  {/* Text Input */}
                  <div style={{ flex: 1 }} className="input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type a message..."
                      value={inputText}
                      onChange={handleInputChange}
                      style={{ paddingLeft: "16px", height: "42px" }}
                      disabled={sendingMessage}
                      required={attachments.length === 0}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sendingMessage || (!inputText.trim() && attachments.length === 0)}
                    style={{ height: "42px", padding: "0 18px", borderRadius: "var(--radius-md)" }}
                  >
                    {sendingMessage ? (
                      <Loader2 className="spinner" size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              color: "var(--text-muted)",
              padding: "40px"
            }}>
              <MessageSquare size={64} style={{ opacity: 0.15, marginBottom: "16px" }} />
              <h3 style={{ color: "var(--text-main)", marginBottom: "8px", fontSize: "1.2rem" }}>Select a Conversation</h3>
              <p style={{ textAlign: "center", fontSize: "0.9rem", maxWidth: "320px" }}>
                Choose a contact from the list on the left to start real-time messaging about your active project gigs.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatPage;
