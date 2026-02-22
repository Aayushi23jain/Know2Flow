import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const startCall = async (currentUserId, otherUserId) => {

  const channelName =
    currentUserId < otherUserId
      ? `${currentUserId}_${otherUserId}`
      : `${otherUserId}_${currentUserId}`;

  const callRef = await addDoc(collection(db, "calls"), {
    from: currentUserId,
    to: otherUserId,
    channelName,
    status: "ringing",
    type: "video",
    createdAt: serverTimestamp(),
  });

  return callRef.id;
};
