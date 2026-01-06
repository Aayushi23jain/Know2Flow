import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, checkActionCode, applyActionCode } from "firebase/auth";

export default function VerifyEmail() {
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Debug: log when component renders
  console.log("VerifyEmail component rendered");

  useEffect(() => {
    console.log("VerifyEmail useEffect running");
    const url = new URL(window.location.href);
    const oobCode = url.searchParams.get("oobCode");
    console.log("VerifyEmail oobCode:", oobCode);
    if (!oobCode) {
      setStatus("error");
      setError("Invalid verification link.");
      return;
    }
    const auth = getAuth();
    console.log("Calling checkActionCode...");
    checkActionCode(auth, oobCode)
      .then(() => {
        console.log("checkActionCode success, calling applyActionCode...");
        return applyActionCode(auth, oobCode);
      })
      .then(() => {
        console.log("applyActionCode success");
        setStatus("success");
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      })
      .catch((err) => {
        console.error("VerifyEmail error:", err);
        setStatus("error");
        setError(err.message || "Verification failed.");
      });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-200 via-purple-100 to-pink-200">
      <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-md border border-gray-200 text-center">
        {status === "verifying" && (
          <p className="text-lg">Verifying your email...</p>
        )}
        {status === "success" && (
          <>
            <p className="text-green-600 font-bold text-xl">Email verified!</p>
            <p className="mt-2">Redirecting to login...</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-red-600 font-bold text-xl">
              Verification failed
            </p>
            <p className="mt-2">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
