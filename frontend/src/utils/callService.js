import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const startCall = async (
  currentUserId,
  otherUserId,
  callerName,
  callerPhoto
) => {
  const channelName =
    currentUserId < otherUserId
      ? `${currentUserId}_${otherUserId}`
      : `${otherUserId}_${currentUserId}`;

  const callRef = await addDoc(collection(db, "calls"), {
    from: currentUserId,
    to: otherUserId,
    callerName,       // ✅ ADD THIS
    callerPhoto,      // ✅ ADD THIS
    channelName,
    status: "ringing",
    type: "video",
    createdAt: serverTimestamp(),
  });

  console.log(callerName);

  return callRef.id;
};
