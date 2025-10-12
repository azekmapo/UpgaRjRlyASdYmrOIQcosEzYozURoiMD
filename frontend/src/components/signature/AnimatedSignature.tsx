"use client";

import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedSignatureProps {
  name?: string;
  className?: string;
  color?: string;
  strokeWidth?: number;
  duration?: number;
  delay?: number;
}

export default function AnimatedSignature({
  name = "Manager votre signatures",
  className = "",
  color = "#000000",
  strokeWidth = 2,
  duration = 2,
  delay = 0,
}: AnimatedSignatureProps) {
  const controls = useAnimation();
  const progress = useMotionValue(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate pen position along the path
  const x = useTransform(progress, [0, 1], [50, 490]);
  const y = useTransform(
    progress,
    [0, 0.25, 0.5, 0.75, 1],
    [100, 70, 90, 110, 80]
  );
  const rotate = useTransform(progress, [0, 1], [-45, -45]);

  const startAnimation = async () => {
    setIsAnimating(true);
    await controls.start("visible");
    await progress.set(1);
    setIsAnimating(false);
  };

  const resetAnimation = async () => {
    if (!isAnimating) {
      await controls.set("hidden");
      progress.set(0);
      startAnimation();
    }
  };

  useEffect(() => {
    startAnimation();
  }, []);

  // const pathVariants = {
  //   hidden: {
  //     pathLength: 0,
  //     opacity: 0,
  //   },
  //   visible: {
  //     pathLength: 1,
  //     opacity: 1,
  //     transition: {
  //       pathLength: { duration, delay, ease: "easeInOut" },
  //       opacity: { duration: 0.01 },
  //     },
  //   },
  // };

  return (
    <div className="relative">
      <button
        onClick={resetAnimation}
        disabled={isAnimating}
        className="absolute -top-2 right-0 p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Replay signature animation"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>

      <svg
        viewBox="0 0 500 200"
        className={`w-full h-auto ${className}`}
        role="img"
        aria-label={`Signature of ${name}`}
      >
        <motion.path
          d="M50,100 
             C100,50 150,30 200,70 
             Q250,110 280,90 
             C320,60 350,80 380,110 
             Q420,150 450,130 
             C480,110 490,80 490,80"
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial="hidden"
          animate={controls}
        />

        <motion.g
          style={{
            x,
            y,
            rotate,
            originX: "50%",
            originY: "50%",
          }}
        >
          <motion.path
            d="M-10,-10 l-2,2 a1,1 0 0,0 3.986,3.987 l13.346-13.349 a2,2 0 0,0 .5-.83 l1.321-4.352 a.5.5 0 0,0-.623-.622 l-4.353,1.32 a2,2 0 0,0-.83.497z"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            scale={0.8}
          />
        </motion.g>

        <motion.text
          x="50"
          y="180"
          fontFamily="Brush Script MT, cursive"
          fontSize="36"
          fill={color}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: {
              delay: duration + delay,
              duration: 0.5,
            },
          }}
        >
          {name}
        </motion.text>
      </svg>
    </div>
  );
}