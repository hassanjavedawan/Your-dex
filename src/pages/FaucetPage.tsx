"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type BaseError,
  useAccount,
  useWriteContract,
  useReadContract,
  useBalance,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import {
  FiExternalLink,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiX,
  FiDroplet,
} from "react-icons/fi";
import { BiCube } from "react-icons/bi";
import { IoMdPulse } from "react-icons/io";
import Faucet_ABI from "../abi/Faucet.json";
import TokenABI from "../abi/Token.json";
import Login from "../components/Login";

// Tranche Faucet Address on HyperLiquid Testnet
const FAUCET_ADDRESS = "0x7d78d80943A5a62346702F4ADAa18D0640dD1a9a";

// Tranche Token Address on HyperLiquid Testnet
const TOKEN_ADDRESS = "0x72e136481c621beA429F6F70C6b770FfE0EB1147";

// Main Faucet Component
export default function FaucetPage() {
  const { address, isConnected, chain } = useAccount();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerText, setTimerText] = useState("");
  const [tokenAddSuccess, setTokenAddSuccess] = useState(false);
  const [isAirdropLoading, setIsAirdropLoading] = useState(false);
  const [airdropSuccess, setAirdropSuccess] = useState(false);
  const [airdropError, setAirdropError] = useState("");
  const [airdropTxHash, setAirdropTxHash] = useState("");

  const {
    data: hash,
    error,
    isPending,
    writeContract,
    reset,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const { data: balance, refetch: refetchBalance } = useBalance({
    address,
    chainId: chain?.id,
  });
  // Read amountPerRequest from faucet contract
  const {
    data: claimAmount,
    isPending: isClaimAmountLoading,
    refetch: refetchClaimAmount,
  } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: Faucet_ABI,
    functionName: "amountPerRequest",
    chainId: chain?.id,
  });

  // Get current user's token balance
  const {
    data: tokenBalance,
    isPending: isTokenBalanceLoading,
    refetch: refetchTokenBalance,
  } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TokenABI,
    functionName: "balanceOf",
    args: [address],
    chainId: chain?.id,
  });
  // Read requestCooldown from contract using the newer useReadContract hook
  const {
    data: claimInterval,
    isPending: isClaimIntervalLoading,
    refetch: refetchClaimInterval,
  } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: Faucet_ABI,
    functionName: "requestCooldown",
    chainId: chain?.id,
  });

  // Read last request time using the newer useReadContract hook
  const {
    data: lastClaimTime,
    isPending: isLastClaimLoading,
    refetch: refetchLastClaimTime,
  } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: Faucet_ABI,
    functionName: "lastRequestTime",
    args: [address],
    chainId: chain?.id,
  });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  // Track transaction status using the proper transaction receipt hooks
  useEffect(() => {
    // Set pending status when transaction is initiated
    if (hash && !isConfirmed) {
      refetchLastClaimTime();
      refetchClaimAmount();
      refetchClaimInterval();
      refetchTokenBalance();
      refetchBalance();
    }

    // Set success status when transaction is confirmed
    if (isConfirmed) {
      // Format the claim amount if available
      refetchLastClaimTime();
      refetchClaimAmount();
      refetchClaimInterval();
      refetchTokenBalance();
      refetchBalance();
      if (claimAmount) {
        try {
          const formattedAmount = formatEther(claimAmount as any);
          console.log(`Claimed ${formattedAmount} Your Dex tokens!`);
        } catch (error) {
          console.error("Claim amount format error:", error);
        }
      }

      // Refresh the last claim time
      if (refetchLastClaimTime) {
        refetchLastClaimTime();
        refetchClaimAmount();
        refetchClaimInterval();
        refetchTokenBalance();
        refetchBalance();
      }
    }
  }, [
    hash,
    isConfirming,
    isConfirmed,
    claimAmount,
    refetchLastClaimTime,
    refetchClaimAmount,
    refetchClaimInterval,
    refetchTokenBalance,
    refetchBalance,
    address,
  ]);

  // isconfirmed then refeash all data

  // Update remaining time
  useEffect(() => {
    if (!isConnected || !lastClaimTime || !claimInterval) return;

    const updateTimer = () => {
      const lastClaimTimeMs = Number(lastClaimTime) * 1000;
      const claimIntervalMs = Number(claimInterval) * 1000;
      const nextClaimTime = lastClaimTimeMs + claimIntervalMs;
      const currentTime = Date.now();
      const remaining = nextClaimTime - currentTime;

      if (remaining <= 0) {
        setTimeRemaining(0);
        setTimerText("Ready to claim");
      } else {
        setTimeRemaining(remaining);
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor(
          (remaining % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimerText(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    // Run immediately once to set initial state
    updateTimer();

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [address, isConnected, lastClaimTime, claimInterval]);

  // Handle claim button click with proper contract interaction
  const handleClaim = async () => {
    if (!isConnected) return;

    try {
      // Call the requestTokens function on the contract
      writeContract({
        address: FAUCET_ADDRESS,
        abi: Faucet_ABI,
        functionName: "requestTokens",
        chainId: chain?.id,
      });
    } catch (error: any) {
      console.error("Claim error:", error);
    }
  };  

  // Function to request ETH airdrop
  const requestEthAirdrop = async () => {
    if (!isConnected || !address) return;

    try {
      setIsAirdropLoading(true);
      setAirdropError("");
      setAirdropSuccess(false);

      console.log("Requesting ETH airdrop for address:", address);

      // Create the request payload
      const payload = JSON.stringify({ address });

      // Make the API call
      const response = await fetch("/.netlify/functions/eth-airdrop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
      });

      // Parse the response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.details || "Failed to request ETH airdrop"
        );
      }

      if (data.success) {
        // Handle successful airdrop
        setAirdropSuccess(true);
        setAirdropTxHash(data.txHash);
        refetchBalance();
        refetchTokenBalance();

        // Refresh balance after successful airdrop
        setTimeout(() => refetchBalance(), 5000);
        setTimeout(() => setAirdropSuccess(false), 10000);
      } else {
        // Handle case where airdrop wasn't needed
        setAirdropError(data.message || "Airdrop not needed");
      }
    } catch (error: any) {
      console.error("ETH airdrop error:", error);
      setAirdropError(error.message || "Failed to request ETH airdrop");
    } finally {
      setIsAirdropLoading(false);
    }
  };

  // Function to add Your Dex token to MetaMask
  const addTokenToWallet = async () => {
    if (!window.ethereum) {
      console.error("MetaMask is not installed");
      return;
    }

    try {
      // Request to add the token to user's wallet
      const wasAdded = await (window.ethereum as any).request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: TOKEN_ADDRESS,
            symbol: "YOURDEX",
            decimals: 18,
            image: "/logo.png", // Using a local token logo in the public folder
          },
        },
      });

      if (wasAdded) {
        setTokenAddSuccess(true);
        setTimeout(() => setTokenAddSuccess(false), 3000); // Reset after 3 seconds
      }
    } catch (error) {
      console.error("Error adding token to wallet:", error);
    }
  };
  if (!isConnected && document.readyState === "complete") {
    console.log("User not connected, redirecting to login");
    return <Login />;
  }
  // Futuristic Scanner effect component
  const ScannerEffect = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-[#BFFF00]/80 z-10 animate-scanner"></div>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-[#BFFF00]/30 z-10 animate-scanner-delayed"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Futuristic Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* Animated Circuit Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"
          animate={{ x: ["100%", "-100%"] }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent"
          animate={{ y: ["-100%", "100%"] }}
          transition={{
            duration: 12,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute right-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent"
          animate={{ y: ["100%", "-100%"] }}
          transition={{
            duration: 9,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-16 h-16 border border-purple-500/30"
          style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute top-40 right-32 w-12 h-12 border border-purple-500/20"
          style={{
            clipPath:
              "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/3 w-20 h-20 border border-purple-500/15"
          style={{
            clipPath:
              "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {tokenAddSuccess && (
          <motion.div
            className="fixed top-8 right-8 z-50 backdrop-blur-md border bg-black/40 border-purple-500/50 text-purple-300"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
            }}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <div className="p-6 pr-12 relative">
              <div className="flex items-center">
                <FiCheckCircle className="mr-3 text-purple-300" />
                <span className="font-medium">
                  Your Dex token added to your wallet!
                </span>
              </div>
              <button
                onClick={() => setTokenAddSuccess(false)}
                className="absolute top-2 right-2 text-white/60 hover:text-white"
              >
                <FiX size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="container mx-auto px-8 py-16 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.div
            className="inline-block mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 blur-xl"></div>
              <div
                className="relative bg-black/60 border border-purple-500/50 px-8 py-4 backdrop-blur-md"
                style={{
                  clipPath:
                    "polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)",
                }}
              >
                <span className="text-purple-300 font-mono text-sm tracking-wider">
                  BASE SEPOLIA TESTNET
                </span>
              </div>
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-6 text-white relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-purple-300 relative">
              $YOURDEX
              <motion.div
                className="absolute -inset-2 bg-purple-500/10 blur-lg"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />
            </span>{" "}
            FAUCET
          </motion.h1>

          <motion.p
            className="text-gray-400 max-w-2xl mx-auto text-lg font-mono"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            CLAIM FREE TOKENS • TEST THE PROTOCOL • BUILD THE FUTURE
          </motion.p>
        </div>

        {/* Main Faucet Interface */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="absolute inset-0 bg-purple-500/5 blur-2xl"></div>
            <div
              className="relative bg-black/40 border border-purple-500/50 backdrop-blur-md overflow-hidden"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 40px 100%, 0 calc(100% - 40px))",
              }}
            >
              {/* Header Accent */}
              <div className="h-2 w-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>

              <div className="p-12">
                {/* Connected Wallet Info */}
                <div
                  className="bg-black/60 border border-purple-500/30 p-6 backdrop-blur-md mb-8"
                  style={{
                    clipPath:
                      "polygon(25px 0, 100% 0, calc(100% - 25px) 100%, 0 100%)",
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-300 font-mono text-sm">
                          CONNECTED:
                        </span>
                        <span className="text-purple-300 font-mono">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </span>
                      </div>
                      <div className="text-gray-300 font-mono text-sm">
                        (
                        {Number(
                          formatEther(balance?.value || ("0" as any))
                        ).toFixed(4)}{" "}
                        ETH)
                      </div>
                    </div>
                    <motion.button
                      onClick={addTokenToWallet}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono text-sm transition-all duration-200"
                      style={{
                        clipPath:
                          "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)",
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <BiCube className="w-4 h-4" />
                      <span>ADD TO WALLET</span>
                    </motion.button>
                  </div>
                </div>

                {/* ETH Airdrop Section */}
                {Number(formatEther(balance?.value || ("0" as any))) === 0 && (
                  <div
                    className="bg-black/60 border border-blue-500/30 p-8 backdrop-blur-md mb-8"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))",
                    }}
                  >
                    <div className="flex items-center mb-6">
                      <div
                        className="w-16 h-16 border border-blue-500/50 flex items-center justify-center mr-4"
                        style={{
                          clipPath:
                            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                        }}
                      >
                        <FiDroplet className="text-blue-400 text-xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white font-mono">
                          ETH FAUCET
                        </h2>
                        <p className="text-gray-400 font-mono text-sm">
                          NEED GAS FOR TRANSACTIONS
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="font-mono text-sm text-gray-400">
                        CURRENT ETH BALANCE:{" "}
                        <span className="text-white">
                          {Number(
                            formatEther(balance?.value || ("0" as any))
                          ).toFixed(4)}{" "}
                          ETH
                        </span>
                      </div>
                      <motion.button
                        onClick={requestEthAirdrop}
                        className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 px-6 py-3 font-mono text-sm tracking-wider"
                        style={{
                          clipPath:
                            "polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)",
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isAirdropLoading}
                      >
                        {isAirdropLoading ? (
                          <span className="flex items-center">
                            <motion.div
                              className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full mr-2"
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "linear",
                              }}
                            />
                            PROCESSING...
                          </span>
                        ) : (
                          "REQUEST 0.001 ETH"
                        )}
                      </motion.button>
                    </div>

                    {/* Airdrop Status */}
                    <AnimatePresence>
                      {airdropSuccess && (
                        <motion.div
                          className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-sm"
                          style={{
                            clipPath:
                              "polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)",
                          }}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="flex items-center">
                            <FiCheckCircle className="mr-2" />
                            <span>ETH AIRDROP SUCCESSFUL!</span>
                          </div>
                          {airdropTxHash && (
                            <a
                              href={`https://sepolia.basescan.org/tx/${airdropTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center mt-2 text-xs hover:underline"
                            >
                              VIEW TRANSACTION{" "}
                              <FiExternalLink className="ml-1" />
                            </a>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Faucet Details */}
                <div
                  className="bg-black/60 border border-purple-500/30 p-8 backdrop-blur-md mb-8"
                  style={{
                    clipPath:
                      "polygon(30px 0, 100% 0, calc(100% - 30px) 100%, 0 100%)",
                  }}
                >
                  <div className="flex items-center mb-6">
                    <BiCube className="text-purple-300 mr-4 text-3xl" />
                    <h2 className="text-2xl font-bold text-white font-mono tracking-wider">
                      FAUCET DETAILS
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                      className="bg-black/40 border border-purple-500/20 p-6 text-center"
                      style={{
                        clipPath:
                          "polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)",
                      }}
                    >
                      <div className="text-gray-400 font-mono text-sm mb-2">
                        CLAIM AMOUNT
                      </div>
                      <div className="text-2xl font-bold text-purple-300 font-mono">
                        {formatEther(claimAmount || ("0" as any))}{" "}
                        <span className="text-sm">YOURDEX</span>
                      </div>
                    </div>
                    <div
                      className="bg-black/40 border border-purple-500/20 p-6 text-center"
                      style={{
                        clipPath:
                          "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)",
                      }}
                    >
                      <div className="text-gray-400 font-mono text-sm mb-2">
                        WAITING PERIOD
                      </div>
                      <div className="text-2xl font-bold text-purple-300 font-mono">
                        {(Number(claimInterval) / 3600).toFixed(1)}{" "}
                        <span className="text-sm">HOURS</span>
                      </div>
                    </div>
                    <div
                      className="bg-black/40 border border-purple-500/20 p-6 text-center"
                      style={{
                        clipPath:
                          "polygon(15px 0, 100% 0, 100% 100%, 0 calc(100% - 15px))",
                      }}
                    >
                      <div className="text-gray-400 font-mono text-sm mb-2">
                        YOUR BALANCE
                      </div>
                      <div className="text-2xl font-bold text-purple-300 font-mono">
                        {formatEther(tokenBalance || ("0" as any))}{" "}
                        <span className="text-sm">YOURDEX</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timer and Claim Section */}
                <div className="text-center">
                  <AnimatePresence mode="wait">
                    {timeRemaining !== null && timeRemaining > 0 ? (
                      <motion.div
                        key="timer"
                        className="mb-8"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div
                          className="bg-black/60 border border-purple-500/30 p-6 backdrop-blur-md inline-block"
                          style={{
                            clipPath:
                              "polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)",
                          }}
                        >
                          <div className="flex items-center justify-center mb-2">
                            <FiClock className="mr-2 text-purple-300" />
                            <span className="text-gray-400 font-mono text-sm">
                              NEXT CLAIM AVAILABLE IN:
                            </span>
                          </div>
                          <div className="text-3xl font-mono text-purple-300 font-bold">
                            {timerText}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="ready"
                        className="mb-8"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div
                          className="bg-purple-500/10 border border-purple-500/50 p-6 backdrop-blur-md inline-block"
                          style={{
                            clipPath:
                              "polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)",
                          }}
                        >
                          <div className="flex items-center justify-center mb-2">
                            <FiCheckCircle className="mr-2 text-purple-300" />
                            <span className="text-purple-300 font-mono text-sm">
                              READY TO CLAIM!
                            </span>
                          </div>
                          <div className="text-lg font-medium text-white font-mono">
                            CLAIM YOUR FREE TOKENS NOW
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Claim Button */}
                  {Number(formatEther(balance?.value || ("0" as any))) > 0 && (
                    <div className="relative group mb-6">
                      <div className="absolute inset-0 bg-purple-500/20 blur-xl group-hover:bg-purple-500/40 transition-all duration-500"></div>
                      <motion.button
                        onClick={handleClaim}
                        disabled={
                          isPending ||
                          isConfirming ||
                          (timeRemaining && timeRemaining > 0) ||
                          undefined
                        }
                        className={`relative px-12 py-6 font-bold font-mono text-lg tracking-wider ${
                          isPending ||
                          isConfirming ||
                          (timeRemaining && timeRemaining > 0)
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-blue-500 hover:to-purple-500"
                        } transition-all duration-300`}
                        style={{
                          clipPath:
                            "polygon(30px 0, 100% 0, calc(100% - 30px) 100%, 0 100%)",
                        }}
                        whileHover={{
                          scale:
                            isPending ||
                            isConfirming ||
                            (timeRemaining && timeRemaining > 0)
                              ? 1
                              : 1.02,
                        }}
                        whileTap={{
                          scale:
                            isPending ||
                            isConfirming ||
                            (timeRemaining && timeRemaining > 0)
                              ? 1
                              : 0.98,
                        }}
                      >
                        {isPending ? (
                          <span className="flex items-center justify-center">
                            <motion.div
                              className="w-6 h-6 border-2 border-gray-500 border-t-white rounded-full mr-3"
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "linear",
                              }}
                            />
                            REQUESTING TOKENS...
                          </span>
                        ) : isConfirming ? (
                          <span className="flex items-center justify-center">
                            <motion.div
                              className="w-6 h-6 border-2 border-gray-500 border-t-white rounded-full mr-3"
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "linear",
                              }}
                            />
                            CONFIRMING...
                          </span>
                        ) : timeRemaining && timeRemaining > 0 ? (
                          "WAIT FOR COOLDOWN"
                        ) : (
                          <span className="flex items-center justify-center">
                            CLAIM YOURDEX TOKENS
                            <motion.div
                              className="ml-3 text-purple-300/70"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{
                                duration: 2,
                                repeat: Number.POSITIVE_INFINITY,
                              }}
                            >
                              <IoMdPulse size={20} />
                            </motion.div>
                          </span>
                        )}
                      </motion.button>
                    </div>
                  )}

                  {/* Status Messages */}
                  <AnimatePresence>
                    {isConfirmed && (
                      <motion.div
                        className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-sm inline-flex items-center"
                        style={{
                          clipPath:
                            "polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)",
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <FiCheckCircle className="mr-2" />
                        <span>TRANSACTION CONFIRMED</span>
                        <button
                          onClick={reset}
                          className="ml-4 hover:text-white"
                        >
                          <FiX />
                        </button>
                      </motion.div>
                    )}
                    {error && (
                      <motion.div
                        className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-sm inline-flex items-center"
                        style={{
                          clipPath:
                            "polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)",
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <FiAlertTriangle className="mr-2" />
                        <span>{error as any}</span>
                        <button
                          onClick={reset}
                          className="ml-4 hover:text-red-300"
                        >
                          <FiX />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Transaction Link */}
                  {hash && (
                    <motion.a
                      href={`https://sepolia.basescan.org/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-purple-300 font-mono text-sm hover:underline"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      VIEW ON BASESCAN <FiExternalLink className="ml-2" />
                    </motion.a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Info Section */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div
              className="bg-black/40 border border-purple-500/30 p-8 backdrop-blur-md"
              style={{
                clipPath:
                  "polygon(40px 0, 100% 0, calc(100% - 40px) 100%, 0 100%)",
              }}
            >
              <div className="flex items-center mb-6">
                <FiInfo className="text-purple-300 mr-4 text-2xl" />
                <h3 className="text-xl font-bold text-white font-mono tracking-wider">
                  ABOUT THIS FAUCET
                </h3>
              </div>

              <p className="text-gray-400 font-mono text-sm mb-6">
                THIS FAUCET DISTRIBUTES TEST $YOURDEX TOKENS ON THE BASE
                SEPOLIA TESTNET. USE THESE TOKENS FOR TESTING THE PROTOCOL
                WITHOUT USING REAL ASSETS.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start">
                  <div
                    className="w-2 h-2 bg-purple-500 mt-2 mr-3"
                    style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
                  ></div>
                  <p className="text-gray-400 font-mono text-sm">
                    EACH CLAIM PROVIDES{" "}
                      {formatEther(claimAmount || ("0" as any))} $YOURDEX TOKENS
                  </p>
                </div>
                <div className="flex items-start">
                  <div
                    className="w-2 h-2 bg-purple-500 mt-2 mr-3"
                    style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
                  ></div>
                  <p className="text-gray-400 font-mono text-sm">
                    CLAIM ONCE EVERY {Number(claimInterval) / 3600} HOURS
                  </p>
                </div>
                <div className="flex items-start">
                  <div
                    className="w-2 h-2 bg-purple-500 mt-2 mr-3"
                    style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
                  ></div>
                  <p className="text-gray-400 font-mono text-sm">
                    CONNECT TO BASE SEPOLIA TESTNET
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
