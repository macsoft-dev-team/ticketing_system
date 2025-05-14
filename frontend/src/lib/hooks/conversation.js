import { useEffect } from "react";
import {
  fetchConversation,
  createMessage,
  setConversation,
  setCurrentMessage,
  setShowConversation,
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
  const {currentData: ticket} = useCrud("ticket");

 

  const refetch = () => {
    dispatch(fetchConversation({  }));
  };

  const createItem = ({ticketId, newMessage}) => {
    try {
      dispatch(createMessage({ ticketId, message: newMessage })).then((res) => {
         socket.on("conversation", (message) => {
           console.log(message, "message");
         });
        if (res.error) {
          throw new Error(res.error.message);
        }
      });
      message.success("Message sent successfully!");
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

  return {
    data,
    setData,
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
