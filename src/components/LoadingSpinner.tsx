import { Bot } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  fullHeight?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullHeight = true,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Futuristic grid lines */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full border border-purple-500/10 rounded-full transform scale-150"></div>
          <div className="absolute top-0 left-0 w-full h-full border border-purple-500/5 rounded-full transform scale-125"></div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-purple-500/30 to-transparent"></div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center relative z-10"
      >
        {/* Hexagonal loader */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="absolute inset-0 w-full h-full border-2 border-purple-500/30 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] border-2 border-dashed border-purple-500/50 rounded-full"
          />

          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-12 h-12 bg-purple-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-purple-500/50">
              <img src="/logo.png" alt="" />{" "}
            </div>
          </motion.div>
        </div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <h3 className="text-xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-purple-300/80">
            Initializing Your Dex
          </h3>
          <p className="text-purple-300/60 text-sm">
            Connecting to neural network...
          </p>

          {/* Progress bar */}
          <div className="w-48 h-1 bg-black/30 rounded-full mx-auto mt-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
              className="h-full bg-gradient-to-r from-purple-500 to-purple-500/50"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;
