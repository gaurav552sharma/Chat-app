import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  smartReplies: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSmartRepliesLoading: false, // ✅ separate flag just for smart replies

  generateSmartRepliesForLastMessages: async () => {
    const { messages, selectedUser } = get();
    if (!messages.length || !selectedUser) return;

    const formattedMessages = messages.slice(-6).map((msg) => {
      if (!msg.text || msg.text.trim() === "") {
        return "User sent a photo";
      }
      return msg.text;
    });

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.senderId !== selectedUser._id) return;

    // ✅ start loading replies
    set({ isSmartRepliesLoading: true, smartReplies: [] });

    try {
      console.log("Generating smart replies for:", formattedMessages);
      const res = await axiosInstance.post(
        "https://frvzwrb1k5.execute-api.us-east-1.amazonaws.com/generate-replies",
        { messages: formattedMessages }
      );

      set({
        smartReplies: res.data.replies || [],
        isSmartRepliesLoading: false, // ✅ stop loader
      });
      console.log("Smart replies:", res.data.replies);
    } catch (error) {
      console.error("Smart reply generation failed:", error);
      toast.error("Failed to generate smart replies");
      set({ isSmartRepliesLoading: false }); // ✅ stop loader on error too
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);

      // ✅ set messages immediately
      set({ messages: res.data, isMessagesLoading: false });

      // ✅ trigger smart replies in background
      get().generateSmartRepliesForLastMessages();
    } catch (error) {
      toast.error(error.response.data.message);
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data], smartReplies: [] });
    } catch (error) {
      console.error("Upload failed:", error);
      const message =
        error?.response?.data?.message || "Image too large or failed to send.";
      toast.error(message);
    }
  },

  handleDeleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`);
      set({
        messages: get().messages.filter((msg) => msg._id !== messageId),
      });
      toast.success("Message deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  subscribeToMessages: () => {
    const selectedUser = get().selectedUser;
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId !== selectedUser._id) return;

      // ✅ update chat instantly
      set({
        messages: [...get().messages, newMessage],
      });

      // ✅ fetch replies separately
      get().generateSmartRepliesForLastMessages();
    });
  },

  unSubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket == null) return;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser, smartReplies: [] });
  },
}));
