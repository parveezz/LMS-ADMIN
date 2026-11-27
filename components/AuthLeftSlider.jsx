"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  {
    title: "Manage Your LMS Faster",
    description:
      "Oversee courses, learners, enrollments, and platform operations from one unified admin workspace.",
  },
  {
    title: "Track Learner Progress",
    description:
      "Monitor course completions, assessment scores, and engagement metrics in real time.",
  },
  {
    title: "Streamline User Access",
    description:
      "Manage admin roles, student accounts, and permissions securely across your organization.",
  },
  {
    title: "Actionable Analytics",
    description:
      "Gain clear insights into enrollments, revenue, and platform performance at a glance.",
  },
];

export function AuthLeftSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const currentSlide = SLIDES[activeIndex];

  return (
    <div className="relative z-10 mx-auto max-w-md space-y-3 text-center">
      <div key={activeIndex} className="min-h-[92px] space-y-3 transition-opacity duration-300">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          {currentSlide.title}
        </h2>
        <p className="text-sm leading-relaxed text-white/70">
          {currentSlide.description}
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5 pt-2">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setActiveIndex(idx)}
            aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
            className={[
              "h-1.5 cursor-pointer rounded-full transition-all duration-300",
              idx === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}
