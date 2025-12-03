import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useSocket } from "../contexts/SocketContext";
import moment from "moment";

export const useConversation = (ticketId) => {
  const { user, token } = useAuth();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format message for display
  const formatMessage = useCallback(
    (rawMessage) => {
      return {
        id: rawMessage.id,
        message: rawMessage.content || rawMessage.message || "",
        isOwnMessage: rawMessage.senderId === user?.id,
        timestamp: moment(rawMessage.createdAt || rawMessage.timestamp).format(
          "hh:mm A"
        ),
        senderName:
          rawMessage.sender?.name ||
          (rawMessage.senderId === user?.id ? "You" : "User"),
        avatar:
          rawMessage.sender?.name?.charAt(0) ||
          (rawMessage.senderId === user?.id
            ? user?.name?.charAt(0) || "A"
            : "U"),
        attachments: (rawMessage.attachments || []).map((att) => ({
          id: att.id,
          name: att.fileName,
          type: att.fileType?.startsWith("image/") ? "image" : "file",
          size: formatFileSize(att.fileSize),
          url: att.fileUrl,
          mimetype: att.fileType,
        })),
        senderId: rawMessage.senderId,
        createdAt: rawMessage.createdAt,
      };
    },
    [user]
  );

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Fetch conversation history
  const fetchMessages = useCallback(async () => {
    if (!ticketId || !token) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || "http:import.meta.env.VITE_WS_URL/api";
      const url = `${baseUrl}/conversations/${ticketId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = `Failed to fetch messages: ${response.status}`;

        if (response.status === 401) {
          errorMessage = "Authentication failed. Please login again.";
        } else if (response.status === 403) {
          errorMessage =
            "Access denied. You may not have permission to view this conversation.";
        } else if (response.status === 404) {
          errorMessage = "Conversation not found or endpoint not available.";
        } else if (response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

        throw new Error(errorMessage);
      }

      const messagesData = await response.json();
      const formattedMessages = messagesData.map(formatMessage);
      setMessages(formattedMessages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ticketId, token, formatMessage]);

  // Send message
  const sendMessage = useCallback(
    async (messageContent, attachments = []) => {
      if (
        !ticketId ||
        !token ||
        (!messageContent.trim() && attachments.length === 0)
      ) { 
        setError("Cannot send message: Missing required data");
        return;
      }
      setError(null); // Clear any previous errors

      try {
        const formData = new FormData();
        formData.append("message", messageContent);

        // Append files if any
        if (attachments && attachments.length > 0) {
          attachments.forEach((file, index) => {
             formData.append("attachments", file);
          });
        }

        const baseUrl =
          import.meta.env.VITE_API_URL || "http:import.meta.env.VITE_WS_URL/api";
        const url = `${baseUrl}/conversations/${ticketId}`;
         const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Failed to send message: ${response.status}`;

          if (response.status === 401) {
            errorMessage = "Authentication failed. Please login again.";
          } else if (response.status === 403) {
            errorMessage =
              "Access denied. You may not have permission to send messages.";
          } else if (response.status === 404) {
            errorMessage =
              "Ticket not found or conversation endpoint not available.";
          } else if (response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }

          throw new Error(errorMessage);
        }

        const newMessage = await response.json();
         // The real-time update will add the message to the UI
        // But we can add optimistic update here if needed
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [ticketId, token]
  );

  // Handle incoming real-time messages
  const handleNewMessage = useCallback(
    (newMessage) => {
      try {
        const formattedMessage = formatMessage(newMessage);

        setMessages((prevMessages) => {
          // Check if message already exists (avoid duplicates)
          const exists = prevMessages.some(
            (msg) => msg.id === formattedMessage.id
          );
          if (exists) {
            return prevMessages;
          }

          // Add new message and sort by timestamp
          const updatedMessages = [...prevMessages, formattedMessage];
          return updatedMessages.sort(
            (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
          );
        });
      } catch (error) {
      }
    },
    [formatMessage]
  );

  // Socket connection is now managed by SocketContext - no need for separate connection

  // Set up conversation listener using SocketContext
  useEffect(() => {
    if (!ticketId || !socket || !isConnected) return;

    // Join conversation room
    socket.emit("join-conversation", parseInt(ticketId));
    // Listen for conversation messages for this specific ticket
    const handleConversationMessage = (message) => {
      // Only process messages for this ticket
      if (message.ticketId === parseInt(ticketId)) {
        handleNewMessage(message);
      }
    };

    socket.on("conversation", handleConversationMessage);

    return () => {
      socket.off("conversation", handleConversationMessage);

      // Leave conversation room
      if (socket && socket.connected) {
        socket.emit("leave-conversation", parseInt(ticketId));
       }
    };
  }, [ticketId, socket, isConnected, handleNewMessage]);

  // Test API connection
  const testConnection = useCallback(async () => {
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || "http:import.meta.env.VITE_WS_URL/api";
      const response = await fetch(`${baseUrl.replace("/api", "")}/`, {
        method: "GET",
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }, []);

  // Fetch initial messages
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Test connection on mount
  useEffect(() => {
    testConnection();
  }, [testConnection]);

  return {
    messages,
    loading,
    error,
    isConnected,
    sendMessage,
    refreshMessages: fetchMessages,
    testConnection,
  };
};

export default useConversation;
