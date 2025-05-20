import { useEffect } from "react";
import {
  fetchConversation as fetchConversationAction,
  createMessage,
  setConversation,
  setCurrentMessage,
  setShowConversation,
  appendMessageToTicket,
} from "../features/conversationSlice";
import { message } from "antd";
import { useSelector, useDispatch } from "react-redux";
import useCrud from "./useCrud";
import socket from "../socket/socket";

export default function useConversation() {
  const dispatch = useDispatch();
  const { data, currentData, show, loading, error } = useSelector(
    (state) => state.conversation.conversation
  );
  const { currentData: ticket } = useCrud("ticket");

  const fetchConversation = (ticketId) => {
    try {
      dispatch(fetchConversationAction(ticketId)).then((res) => {
        if (res.error) {
          throw new Error(res.error.message);
        }
      });
    } catch (error) {
      message.error("Error fetching conversation: " + error.message);
    }
  };

  const refetch = () => {
    dispatch(fetchConversation({}));
  };

  const createItem = ({ ticketId, newMessage }) => {
    try {
      dispatch(createMessage({ ticketId, message: newMessage }));
    } catch (error) {
      message.error("Error sending message: " + error.message);
    }
  };

  const setCurrentData = (currentData) => {
    dispatch(setCurrentMessage(currentData));
  };

  const setModal = (show) => {
    dispatch(setShowConversation(show));
  };

  const setData = (data) => {
    dispatch(setConversation(data));
  };

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("connect", () => {
      console.log("Connected for conversation:", socket.id);
    });

    socket.on("conversation", (newConversation) => {
      dispatch(appendMessageToTicket(newConversation));
    });

    return () => {
      socket.disconnect();
      socket.off("conversation");
    };
  }, []);

  return {
    data,
    setData,
    fetchConversation,
    currentData,
    show,
    loading,
    error,
    refetch,
    createItem,
    setCurrentData,
    setModal,
  };
}
