import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function Challenge() {
  const { userId } = useParams();
  const navigate = useNavigate();

  // State Management
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // MCQ Data Set
  const challengeSet = [
    {
      question: "What is the correct way to deallocate memory for an array allocated using 'new int[10]' in C++?",
      options: ["delete p;", "free(p);", "delete[] p;", "destruct(p);"],
      correctAnswer: 2
    },
    {
      question: "Which of the following features allows a function to be overridden in a derived class to achieve runtime polymorphism?",
      options: ["Function Overloading", "Virtual Functions", "Inline Functions", "Static Dispatch"],
      correctAnswer: 1
    }
  ];

  const challengeMeta = {
    title: "C++ Memory & OOP",
    date: "January 10, 2026",
    currentScore: 1250,
    rank: "#42",
    tags: ["C++", "Pointers", "OOP"],
    constraints: [
      "Select only one correct answer per question.",
      "Timer starts upon revealing the questions and you cannot return to the locked state once started.",
      "You can submit your answer only once."
    ]
  };

  // Timer Logic
  useEffect(() => {
    let timer;
    if (isStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, timeLeft]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-white
      bg-[radial-gradient(ellipse_at_top_left,_rgba(255,186,73,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(255,215,0,0.05),_transparent_55%),linear-gradient(135deg,#0b0b10,#111421,#141a2b,#0a0c14)]">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-[-120px] left-[-120px] w-[420px] h-[420px] bg-orange-400/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[420px] h-[420px] bg-yellow-400/10 rounded-full blur-[140px]" />

      <header className="w-full py-3 bg-gradient-to-r from-[#11131a]/80 to-[#0b0c10]/80 backdrop-blur-md border-b border-white/5 relative z-20">
        <div className="flex items-center px-4 md:px-8 max-w-full">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
          </button>

          <div className="flex-1 text-center">
            <div 
              className="text-2xl font-bold text-orange-400 cursor-pointer inline-block" 
              onClick={() => navigate(`/dashboard/${userId}`)}
            >
              Know2Flow
            </div>
          </div>
          <div className="w-12 md:w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 relative z-10">
        
        {/* Challenge Header Card */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-4 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 tracking-wide uppercase">
                Weekly Challenge
              </span>
              <span className="text-gray-400 text-sm">{challengeMeta.date}</span>
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {challengeMeta.title}
            </h1>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-sm text-gray-400 mb-1 font-semibold uppercase tracking-tighter">Time Remaining</div>
            <div className={`text-2xl font-mono font-bold ${isStarted ? 'text-orange-400 animate-pulse' : 'text-gray-600'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Question Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#161a23]/60 backdrop-blur-sm min-h-[400px] flex flex-col justify-center">
              
              {!isStarted && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0b0c10]/90 backdrop-blur-2xl p-10 text-center">
                  <div className="text-4xl mb-4">⏳</div>
                  <h3 className="text-xl font-bold text-white mb-2">Challenge Locked</h3>
                  <p className="text-orange-400 text-sm font-semibold tracking-wide uppercase mb-2">
                    Timer starts immediately on click
                  </p>
                  <p className="text-gray-400 text-xs max-w-sm leading-relaxed">
                    Please use the <span className="text-white font-bold">Start Challenge</span> button on the right to reveal the C++ questions.
                  </p>
                </div>
              )}

              <div className={`p-10 transition-all duration-700 ${!isStarted ? 'blur-3xl opacity-0' : 'opacity-100'}`}>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-orange-400 text-xs font-black uppercase tracking-[0.2em]">Problem Statement</h3>
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Question {currentQuestionIndex + 1} / {challengeSet.length}</span>
                </div>

                <p className="text-gray-200 text-lg leading-relaxed font-light mb-10">
                  {challengeSet[currentQuestionIndex].question}
                </p>

                <div className="grid grid-cols-1 gap-4">
                  {challengeSet[currentQuestionIndex].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedOption(index)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                        selectedOption === index
                          ? "border-orange-500 bg-orange-500/10 text-white shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                          : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedOption === index ? "border-orange-500" : "border-gray-600"
                      }`}>
                        {selectedOption === index && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                      </div>
                      <span className="text-sm font-medium font-mono">{option}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {challengeMeta.tags.map((tag, i) => (
                <span key={i} className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1c212e] to-[#0b0c10] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
              <div className="relative z-10 text-center">
                <h3 className="text-gray-400 uppercase tracking-widest text-[10px] mb-6 font-bold">Your Performance</h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="border-r border-white/10">
                    <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Score</div>
                    <div className="text-2xl font-bold text-white tracking-tight">{challengeMeta.currentScore}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Rank</div>
                    <div className="text-2xl font-bold text-yellow-400 tracking-tight">{challengeMeta.rank}</div>
                  </div>
                </div>
                {isStarted ? (
                  <button
                    onClick={() => {
                      if (currentQuestionIndex < challengeSet.length - 1) {
                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                        setSelectedOption(null);
                      } else {
                        alert("Submission successful!");
                      }
                    }}
                    className={`w-full font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 mb-4 tracking-wide ${
                      currentQuestionIndex < challengeSet.length - 1 
                      ? "bg-orange-500 text-white hover:bg-orange-400" 
                      : "bg-green-500 text-black hover:bg-green-400"
                    }`}
                  >
                    {currentQuestionIndex < challengeSet.length - 1 ? "NEXT QUESTION" : "SUBMIT CHALLENGE"}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsStarted(true)}
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-black py-4 rounded-2xl shadow-xl hover:shadow-orange-500/20 transition-all active:scale-95 mb-4"
                  >
                    START CHALLENGE
                  </button>
                )}
              </div>
            </div>

            {/* Rules Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h4 className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Community Rules</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed italic">
                Fair play is essential. External tools are permitted but direct copy-pasting of solutions will result in rank penalties.
              </p>
            </div>

            {/* Constraints Card (Newly moved here) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h4 className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Constraints</h4>
              <ul className="space-y-3">
                {challengeMeta.constraints.map((c, i) => (
                  <li key={i} className="flex items-start gap-3 text-[11px] text-gray-400 leading-tight">
                    <div className="w-1.5 h-1.5 mt-1 rounded-full bg-orange-500 flex-shrink-0" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}