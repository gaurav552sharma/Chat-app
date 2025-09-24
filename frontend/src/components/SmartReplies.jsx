import { useChatStore } from "../store/useChatStore";

export default function SmartReplies() {
  const { smartReplies, isSmartRepliesLoading, sendMessage } = useChatStore();

  const handleSelectReply = async (reply) => {
    if (!reply) return;
    try {
      await sendMessage({
        text: reply,
        image: null,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="mt-2 px-3">
      {isSmartRepliesLoading && (
        <p className="text-sm text-gray-500 italic">
          Generating smart replies...
        </p>
      )}

      {!isSmartRepliesLoading && smartReplies.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-1 ">
          {smartReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectReply(reply)}
              className="bg-blue-200 hover:bg-blue-300 text-sm px-3 py-1 rounded-lg transition"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
