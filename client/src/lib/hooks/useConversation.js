import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useSocket } from "../contexts/SocketContext";
import { useSoundManager } from "./SoundManager";
import moment from "moment";

export const useConversation = (ticketId) => {
  const { user, token } = useAuth();
  const { socket, isConnected } = useSocket();
  const { play, muted } = useSoundManager();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to get deleted-for-me message IDs from localStorage
  const getDeletedForMeIds = useCallback(() => {
    if (!user?.id) return [];
    try {
      const stored = localStorage.getItem(`chat_deleted_for_me_${user.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [user?.id]);

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format message for display
  const formatMessage = useCallback(
    (rawMessage) => {
      const content = rawMessage.content || rawMessage.message || "";
      const isDeleted = content === "🚫 This message was deleted" || rawMessage.isDeleted || false;

      return {
        id: rawMessage.id,
        message: content,
        isOwnMessage: rawMessage.senderId === user?.id,
        isDeleted,
        isEdited: rawMessage.isEdited || false,
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
        attachments: isDeleted
          ? []
          : (rawMessage.attachments || []).map((att) => ({
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

  // Fetch conversation history
  const fetchMessages = useCallback(async () => {
    if (!ticketId || !token) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const baseUrl =
        import.meta.env.VITE_API_URL || "/api";
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
      const deletedIds = getDeletedForMeIds();
      // Filter out messages deleted for current user
      const visibleMessages = messagesData.filter(
        (m) => !deletedIds.includes(m.id)
      );
      const formattedMessages = visibleMessages.map(formatMessage);
      setMessages(formattedMessages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ticketId, token, formatMessage, getDeletedForMeIds]);

  // Handle incoming real-time messages
  const handleNewMessage = useCallback(
    (newMessage) => {
      try {
        const deletedIds = getDeletedForMeIds();
        if (deletedIds.includes(newMessage.id)) {
          return;
        }

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
        console.error("Error handling new message:", error);
      }
    },
    [formatMessage, getDeletedForMeIds]
  );

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
          attachments.forEach((file) => {
            formData.append("attachments", file);
          });
        }

        const baseUrl =
          import.meta.env.VITE_API_URL || "/api";
        const url = `${baseUrl}/conversations/${ticketId}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
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

        const savedMessage = await response.json();
        if (savedMessage && savedMessage.id) {
          handleNewMessage(savedMessage);
        }
        return savedMessage;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [ticketId, token, handleNewMessage]
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId, newContent) => {
      if (!messageId || !newContent?.trim()) return;

      const trimmed = newContent.trim();
      if (trimmed.length > 191) {
        throw new Error("Message cannot exceed 191 characters");
      }

      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, message: trimmed, isEdited: true }
            : msg
        )
      );

      try {
        const baseUrl = import.meta.env.VITE_API_URL || "/api";
        const res = await fetch(`${baseUrl}/conversations/message/${messageId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: trimmed }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to edit message: ${res.status}`);
        }
      } catch (err) {
        // Rollback on failure
        fetchMessages();
        throw err;
      }
    },
    [token, fetchMessages]
  );

  // Delete message for everyone
  const deleteForEveryone = useCallback(
    async (messageId) => {
      if (!messageId) return;

      const tombstone = "🚫 This message was deleted";
      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, message: tombstone, isDeleted: true, attachments: [] }
            : msg
        )
      );

      try {
        const baseUrl = import.meta.env.VITE_API_URL || "/api";
        const res = await fetch(`${baseUrl}/conversations/message/${messageId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to delete message: ${res.status}`);
        }
      } catch (err) {
        fetchMessages();
        throw err;
      }
    },
    [token, fetchMessages]
  );

  // Delete message for me (local storage persistence)
  const deleteForMe = useCallback(
    (messageId) => {
      if (!messageId) return;
      if (user?.id) {
        try {
          const existing = getDeletedForMeIds();
          if (!existing.includes(messageId)) {
            const next = [...existing, messageId];
            localStorage.setItem(`chat_deleted_for_me_${user.id}`, JSON.stringify(next));
          }
        } catch (e) {
          console.error("Error storing deleted for me ID:", e);
        }
      }

      // Immediately remove from UI
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    },
    [user?.id, getDeletedForMeIds]
  );



  // Set up conversation listeners using SocketContext
  useEffect(() => {
    if (!ticketId || !socket || !isConnected) return;

    // Join conversation room
    socket.emit("join-conversation", parseInt(ticketId));

    // Listen for conversation messages for this specific ticket
    const handleConversationMessage = (message) => {
      if (message.ticketId === parseInt(ticketId)) {
        handleNewMessage(message);
      }
    };

    // Listen for real-time edits
    const handleConversationUpdated = (updated) => {
      if (updated.ticketId === parseInt(ticketId)) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === updated.id
              ? { ...msg, message: updated.content, isEdited: true }
              : msg
          )
        );
      }
    };

    // Listen for real-time deletions
    const handleConversationDeleted = (deleted) => {
      if (deleted.ticketId === parseInt(ticketId)) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === deleted.id
              ? {
                  ...msg,
                  message: "🚫 This message was deleted",
                  isDeleted: true,
                  attachments: [],
                }
              : msg
          )
        );
      }
    };

    socket.on("conversation", handleConversationMessage);
    socket.on("conversation-updated", handleConversationUpdated);
    socket.on("conversation-deleted", handleConversationDeleted);

    return () => {
      socket.off("conversation", handleConversationMessage);
      socket.off("conversation-updated", handleConversationUpdated);
      socket.off("conversation-deleted", handleConversationDeleted);

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
        import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(`${baseUrl.replace("/api", "")}/`, {
        method: "GET",
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }, []);

  // Mark messages as seen for a ticket
  const markMessagesAsSeen = useCallback(
    async (messageIds = null) => {
      if (!ticketId || !token) return;

      try {
        const baseUrl =
          import.meta.env.VITE_API_URL || "/api";
        const url = `${baseUrl}/conversations/${ticketId}/mark-seen`;

        const body = messageIds ? { messageIds } : {};

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`Failed to mark messages as seen: ${response.status}`);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Error marking messages as seen:", error);
      }
    },
    [ticketId, token]
  );

  // Mark specific message as seen
  const markMessageAsSeen = useCallback(
    async (messageId) => {
      if (!messageId || !token) return;

      try {
        const baseUrl =
          import.meta.env.VITE_API_URL || "/api";
        const url = `${baseUrl}/conversations/message/${messageId}/seen`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to mark message as seen: ${response.status}`);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Error marking message as seen:", error);
      }
    },
    [token]
  );

  // Get unread message count
  const getUnreadCount = useCallback(
    async () => {
      if (!ticketId || !token) return 0;

      try {
        const baseUrl =
          import.meta.env.VITE_API_URL || "/api";
        const url = `${baseUrl}/conversations/${ticketId}/unread-count`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get unread count: ${response.status}`);
        }

        const result = await response.json();
        return result.unreadCount || 0;
      } catch (error) {
        console.error("Error getting unread count:", error);
        return 0;
      }
    },
    [ticketId, token]
  );

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
    editMessage,
    deleteForEveryone,
    deleteForMe,
    refreshMessages: fetchMessages,
    testConnection,
    // MessageSeen functions
    markMessagesAsSeen,
    markMessageAsSeen,
    getUnreadCount,
  };
};

export default useConversation;
