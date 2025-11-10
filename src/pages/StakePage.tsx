import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type BaseError,
  useAccount,
  useBalance,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ethers } from "ethers";
import {
  FaLock,
  FaShieldAlt,
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { MdOutlineWaves } from "react-icons/md";
import { BiCube } from "react-icons/bi";
import { IoMdPulse } from "react-icons/io";
import { FiX, FiInfo } from "react-icons/fi";
import { baseSepolia } from "wagmi/chains";
import StakingABI from "../abi/Staking.json";
import TokenABI from "../abi/Token.json";
import { Link } from "react-router-dom";
import Login from "../components/Login";
import LoadingSpinner from "../components/LoadingSpinner";

const StakingPage = () => {
  // Contract addresses
  const TOKEN_ADDRESS = "0x72e136481c621beA429F6F70C6b770FfE0EB1147";
  const STAKING_CONTRACT_ADDRESS = "0x0bF726f313F4Ac7F3969696B540BCe651629A56C";

  // Contract duration constants (in seconds)
  const WEEK_1 = 7 * 24 * 60 * 60;
  const WEEK_4 = 4 * 7 * 24 * 60 * 60;
  const WEEK_12 = 12 * 7 * 24 * 60 * 60;
  const WEEK_24 = 24 * 7 * 24 * 60 * 60;
  const WEEK_52 = 52 * 7 * 24 * 60 * 60;
  const MAX_DURATION = 104 * 7 * 24 * 60 * 60; // 2 years

  // Duration options for the UI
  const durationOptions = [
    { label: "1 Week", value: 604800, apy: "10%" },
    { label: "4 Weeks", value: 2419200, apy: "18%" },
    { label: "12 Weeks", value: 7257600, apy: "21%" },
    { label: "24 Weeks", value: 14515200, apy: "24%" },
    { label: "52 Weeks", value: 31449600, apy: "30%" },
    { label: "2 Years", value: 62899200, apy: "40%" },
  ];
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
  // State management
  const [stakeDuration, setStakeDuration] = useState(WEEK_1); // Default to 1 week
  const [stakeAmount, setStakeAmount] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("stake"); // stake or rewards
  const [pulseEffect, setPulseEffect] = useState(false);
  const [userStakes, setUserStakes] = useState<any[]>([]);
  const [totalUserStaked, setTotalUserStaked] = useState("0");
  const [totalUserRewards, setTotalUserRewards] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStakeIndex, setSelectedStakeIndex] = useState<number | null>(
    null
  );
  const [needsApproval, setNeedsApproval] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{
    [key: number]: {
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
      totalSeconds: number;
    };
  }>({});

  // Stats state
  const [totalValueLocked, setTotalValueLocked] = useState("0");
  const [activeStakers, setActiveStakers] = useState("0");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info"
  );

  // Use Wagmi hooks for wallet connection
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
    token: TOKEN_ADDRESS,
  });

  // Calculate APY based on stake duration
  const calculateAPY = () => {
    const option = durationOptions.find((opt) => opt.value === stakeDuration);
    return option ? option.apy : "0%";
  };

  // Pulse effect for UI elements
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1500);
    }, 5000);

    return () => clearInterval(pulseInterval);
  }, []);

  // Calculate and update time remaining for each stake
  useEffect(() => {
    if (userStakes.length === 0) return;

    const updateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000);
      const updatedTimeRemaining: { [key: number]: any } = {};

      userStakes.forEach((stake, index) => {
        const endTimeSeconds = stake.endTime.toNumber();
        const remainingSeconds = Math.max(0, endTimeSeconds - now);

        if (remainingSeconds > 0) {
          const days = Math.floor(remainingSeconds / 86400);
          const hours = Math.floor((remainingSeconds % 86400) / 3600);
          const minutes = Math.floor((remainingSeconds % 3600) / 60);
          const seconds = remainingSeconds % 60;

          updatedTimeRemaining[index] = {
            days,
            hours,
            minutes,
            seconds,
            totalSeconds: remainingSeconds,
          };
        } else {
          updatedTimeRemaining[index] = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            totalSeconds: 0,
          };
        }
      });

      setTimeRemaining(updatedTimeRemaining);
    };

    // Initial update
    updateTimeRemaining();

    // Update every second
    const timerInterval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(timerInterval);
  }, [userStakes]);

  // Fetch user stakes when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchUserStakes();
      checkAllowance();
    }
  }, [isConnected, address]);

  // Check if approval is needed whenever stakeAmount changes
  useEffect(() => {
    if (isConnected && address && stakeAmount) {
      checkAllowance();
    }
  }, [stakeAmount, address, isConnected]);

  // Fetch stats when component loads
  useEffect(() => {
    if (isConnected) {
      const fetchStats = async () => {
        try {
          // Fetch total staked amount
          await fetchTotalStaked();
        } catch (err) {
          console.error("Error fetching stats:", err);
        }
      };

      fetchStats();
    }
  }, [isConnected]);

  // Check token allowance
  const checkAllowance = async () => {
    if (!address || !stakeAmount) return;

    try {
      const provider = window.ethereum
        ? new ethers.providers.Web3Provider(window.ethereum)
        : null;
      if (!provider) return;

      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        TokenABI,
        provider
      );

      const allowance = await tokenContract.allowance(
        address,
        STAKING_CONTRACT_ADDRESS
      );
      const amount = ethers.utils.parseUnits(stakeAmount, 18);

      setNeedsApproval(allowance.lt(amount));
    } catch (err) {
      console.error("Error checking allowance:", err);
    }
  };

  // Get total staked amount
  const fetchTotalStaked = async () => {
    try {
      const provider = window.ethereum
        ? new ethers.providers.Web3Provider(window.ethereum)
        : null;
      if (!provider) return "0";

      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT_ADDRESS,
        StakingABI,
        provider
      );

      const totalStaked = await stakingContract.totalStaked();
      const formattedTotal = ethers.utils.formatUnits(totalStaked, 18);

      // Update the total value locked state
      setTotalValueLocked(formattedTotal);

      return formattedTotal;
    } catch (err) {
      console.error("Error fetching total staked:", err);
      return "0";
    }
  };

  // Show toast message
  const showToastMessage = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    // Auto hide after 5 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  // Get user stake info for each duration
  const fetchUserStakes = async () => {
    if (!address) return;
    setIsLoading(true);

    try {
      const provider = window.ethereum
        ? new ethers.providers.Web3Provider(window.ethereum)
        : null;
      if (!provider) {
        setIsLoading(false);
        return;
      }

      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT_ADDRESS,
        StakingABI,
        provider
      );

      const stakes: any[] = [];
      let totalStaked = ethers.BigNumber.from(0);
      let totalRewards = ethers.BigNumber.from(0);

      for (const option of durationOptions) {
        try {
          const result = await stakingContract.getUserStakeInfo(
            address,
            option.value
          );
          if (result && result.amount.gt(0)) {
            const stakeInfo = {
              duration: option.value,
              durationLabel: option.label,
              amount: result.amount,
              amountFormatted: ethers.utils.formatUnits(result.amount, 18),
              startTime: result.startTime,
              endTime: result.endTime,
              pendingRewards: result.pendingRewards,
              pendingRewardsFormatted: ethers.utils.formatUnits(
                result.pendingRewards,
                18
              ),
              apy: option.apy,
              canUnstake:
                Math.floor(Date.now() / 1000) >= result.endTime.toNumber(),
            };
            stakes.push(stakeInfo);
            totalStaked = totalStaked.add(result.amount);
            totalRewards = totalRewards.add(result.pendingRewards);
          }
        } catch (err) {
          console.error(
            `Error fetching stake for duration ${option.value}:`,
            err
          );
        }
      }

      setUserStakes(stakes);
      setTotalUserStaked(ethers.utils.formatUnits(totalStaked, 18));
      setTotalUserRewards(ethers.utils.formatUnits(totalRewards, 18));

      // Also fetch total staked for all users
      const totalStakedAll = await fetchTotalStaked();
      console.log("Total staked by all users:", totalStakedAll);
    } catch (err) {
      console.error("Error fetching user stakes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Approve token spending
  const approveTokens = async () => {
    if (!address) return;

    setIsApproving(true);
    setSuccess("");
    reset(); // Reset any previous errors

    try {
      // Use Wagmi's writeContract to approve tokens
      writeContract({
        address: TOKEN_ADDRESS,
        abi: TokenABI,
        functionName: "approve",
        args: [
          STAKING_CONTRACT_ADDRESS,
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        ],
        chainId: chain?.id,
      });

      // Success message and state updates will be handled in the useEffect that watches for isConfirmed
    } catch (err: any) {
      console.error("Error approving tokens:", err);
      setIsApproving(false);
    }
  };

  // Effect to handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      refetchBalance();
      // Transaction confirmed
      if (isApproving) {
        setSuccess("Token approval successful!");
        showToastMessage("Token approval successful!", "success");
        setNeedsApproval(false);
        refetchBalance();

        setIsApproving(false);
      } else if (isStaking) {
        const message = `Successfully staked ${stakeAmount} Your Dex tokens!`;
        setSuccess(message);
        showToastMessage(message, "success");
        setStakeAmount("");
        fetchUserStakes();
        fetchTotalStaked();
        refetchBalance();

        setIsStaking(false);
      } else if (isUnstaking && selectedStakeIndex !== null) {
        const stake = userStakes[selectedStakeIndex];
        const message = `Successfully unstaked ${stake.amountFormatted} Your Dex tokens!`;
        setSuccess(message);
        showToastMessage(message, "success");
        fetchUserStakes();
        fetchTotalStaked();
        refetchBalance();

        setIsUnstaking(false);
        setSelectedStakeIndex(null);
      } else if (isClaiming && selectedStakeIndex !== null) {
        const stake = userStakes[selectedStakeIndex];
        const message = `Successfully claimed ${stake.pendingRewardsFormatted} Your Dex tokens!`;
        setSuccess(message);
        showToastMessage(message, "success");
        fetchUserStakes();
        setIsClaiming(false);
        refetchBalance();

        setSelectedStakeIndex(null);
      }
    } else if (error) {
      // Transaction error
      const errorMessage =
        (error as BaseError).shortMessage ||
        error.message ||
        "Transaction failed";
      showToastMessage(errorMessage, "error");
    }
  }, [isConfirmed, hash, error]);

  // Handle staking submission
  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      return;
    }

    if (chain?.id !== baseSepolia.id) {
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      return;
    }

    // Check if stake amount is greater than balance
    if (
      balanceData &&
      parseFloat(stakeAmount) > parseFloat(balanceData.formatted)
    ) {
      return;
    }

    // Check if approval is needed
    // if (needsApproval) {
    //   await approveTokens();
    //   return;
    // }

    setIsStaking(true);
    setSuccess("");
    reset(); // Reset any previous errors

    try {
      // Use Wagmi's writeContract to interact with the staking contract
      writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: StakingABI,
        functionName: "stake",
        args: [
          BigInt(ethers.utils.parseUnits(stakeAmount, 18).toString()),
          BigInt(stakeDuration),
        ],
        chainId: chain?.id,
      });

      // Success message and state updates will be handled in the useEffect that watches for isConfirmed
    } catch (err: any) {
      console.error("Error staking tokens:", err);
      setIsStaking(false);
    }
  };

  // Handle unstaking
  const handleUnstake = async (index: number) => {
    if (!isConnected || !userStakes[index]) return;

    setSelectedStakeIndex(index);
    setIsUnstaking(true);
    setSuccess("");
    reset(); // Reset any previous errors

    try {
      const stake = userStakes[index];

      // Use Wagmi's writeContract to interact with the staking contract
      writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: StakingABI,
        functionName: "unstake",
        args: [BigInt(stake.duration)],
        chainId: chain?.id,
      });

      // Success message and state updates will be handled in the useEffect that watches for isConfirmed
    } catch (err: any) {
      console.error("Error unstaking tokens:", err);
      setIsUnstaking(false);
      setSelectedStakeIndex(null);
    }
  };

  // Handle claiming rewards
  const handleClaimRewards = async (index: number) => {
    if (!isConnected || !userStakes[index]) return;

    setSelectedStakeIndex(index);
    setIsClaiming(true);
    setSuccess("");
    reset(); // Reset any previous errors

    try {
      const stake = userStakes[index];

      // Use Wagmi's writeContract to interact with the staking contract
      writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: StakingABI,
        functionName: "claimRewards",
        args: [BigInt(stake.duration)],
        chainId: chain?.id,
      });

      // Success message and state updates will be handled in the useEffect that watches for isConfirmed
    } catch (err: any) {
      console.error("Error claiming rewards:", err);
      setIsClaiming(false);
      setSelectedStakeIndex(null);
    }
  };

  if (!isConnected && document.readyState === "complete") {
    console.log("User not connected, redirecting to login");
    return <Login />;
  }

  // Show loading spinner when transactions are processing
  // if (isStaking || isUnstaking || isClaiming || isApproving || isConfirming) {
  //   return <LoadingSpinner />;
  // }

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

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className={`fixed top-8 right-8 z-50 backdrop-blur-md border ${
              toastType === "success"
                ? "bg-black/40 border-purple-500/50 text-purple-300"
                : toastType === "error"
                ? "bg-black/40 border-red-400/50 text-red-300"
                : "bg-black/40 border-purple-500/50 text-purple-300"
            }`}
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
                {toastType === "success" && (
                  <FaCheckCircle className="mr-3 text-purple-300" />
                )}
                {toastType === "error" && (
                  <FaExclamationTriangle className="mr-3 text-red-400" />
                )}
                {toastType === "info" && (
                  <FiInfo className="mr-3 text-purple-300" />
                )}
                <span className="font-medium">{toastMessage}</span>
              </div>
              <button
                onClick={() => setShowToast(false)}
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
                  YOURDEX PROTOCOL
                </span>
              </div>
            </div>
          </motion.div>

          <motion.h1
            className="text-6xl md:text-7xl font-bold mb-6 text-white relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            STAKE{" "}
            <span className="text-purple-300 relative">
              YOURDEX
              <motion.div
                className="absolute -inset-2 bg-purple-500/10 blur-lg"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />
            </span>
          </motion.h1>

          <motion.p
            className="text-gray-400 max-w-2xl mx-auto text-lg font-mono"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            EARN REWARDS • PARTICIPATE IN GOVERNANCE • UNLOCK THE FUTURE
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          <motion.div
            className="relative group"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="absolute inset-0 bg-purple-500/10 blur-xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
            <div
              className="relative bg-black/60 border border-purple-500/50 p-8 backdrop-blur-md group-hover:border-purple-500/80 transition-all duration-500"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))",
              }}
            >
              <div className="flex items-center mb-4">
                <BiCube className="text-purple-300 text-2xl mr-3" />
                <span className="text-gray-400 font-mono text-sm tracking-wider">
                  TOTAL VALUE LOCKED
                </span>
              </div>
              <div className="text-3xl font-bold text-white font-mono">
                <span className="text-purple-300">
                  {Number.parseFloat(totalValueLocked).toLocaleString()}
                </span>
                <span className="text-sm text-purple-300/70 ml-2">YOURDEX</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative group"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="absolute inset-0 bg-purple-500/10 blur-xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
            <div
              className="relative bg-black/60 border border-purple-500/50 p-8 backdrop-blur-md group-hover:border-purple-500/80 transition-all duration-500"
              style={{
                clipPath:
                  "polygon(30px 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%, 0 30px)",
              }}
            >
              <div className="flex items-center mb-4">
                <FaChartLine className="text-purple-300 text-2xl mr-3" />
                <span className="text-gray-400 font-mono text-sm tracking-wider">
                  APY RANGE
                </span>
              </div>
              <div className="text-3xl font-bold text-purple-300 font-mono flex items-center">
                {durationOptions[0].apy.replace("%", "")}-
                {durationOptions[durationOptions.length - 1].apy}
                <motion.div
                  className="ml-3 text-purple-300/70"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <IoMdPulse size={20} />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/10 blur-lg"></div>
            <div className="relative bg-black/60 border border-purple-500/50 backdrop-blur-md flex">
              <button
                className={`px-12 py-4 font-mono text-sm tracking-wider transition-all duration-300 relative ${
                  activeTab === "stake"
                    ? "bg-purple-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("stake")}
                style={{
                  clipPath:
                    activeTab === "stake"
                      ? "polygon(0 0, calc(100% - 20px) 0, 100% 100%, 0 100%)"
                      : "none",
                }}
              >
                STAKE
              </button>
              <button
                className={`px-12 py-4 font-mono text-sm tracking-wider transition-all duration-300 relative ${
                  activeTab === "rewards"
                    ? "bg-purple-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("rewards")}
                style={{
                  clipPath:
                    activeTab === "rewards"
                      ? "polygon(20px 0, 100% 0, 100% 100%, 0 100%)"
                      : "none",
                }}
              >
                REWARDS
              </button>
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
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

              {activeTab === "stake" ? (
                <div className="p-12">
                  <div className="flex items-center mb-8">
                    <BiCube className="text-purple-300 mr-4 text-3xl" />
                    <h2 className="text-2xl font-bold text-white font-mono tracking-wider">
                      STAKE YOUR TOKENS
                    </h2>
                  </div>

                  <form>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      {/* Left Column - Info */}
                      <div>
                        <div className="mb-8">
                          <div
                            className="bg-black/60 border border-purple-500/30 p-6 backdrop-blur-md mb-6"
                            style={{
                              clipPath:
                                "polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)",
                            }}
                          >
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-gray-400 font-mono text-sm">
                                YOUR BALANCE
                              </span>
                              <span className="font-bold text-white font-mono">
                                {Number.parseFloat(
                                  balanceData?.formatted || "0"
                                ).toFixed(2)}{" "}
                                YOURDEX
                              </span>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-gray-400 font-mono text-sm">
                                STAKING APY
                              </span>
                              <span className="font-bold text-purple-300 font-mono">
                                {calculateAPY()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 font-mono text-sm">
                                LOCK PERIOD
                              </span>
                              <span className="font-bold text-white font-mono">
                                {
                                  durationOptions.find(
                                    (option) => option.value === stakeDuration
                                  )?.label
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Duration Selector */}
                        <div className="mb-8">
                          <div className="flex justify-between items-center mb-4">
                            <label className="text-gray-400 font-mono text-sm tracking-wider">
                              STAKING DURATION
                            </label>
                          </div>
                          <div
                            className="bg-black/60 border border-purple-500/30 p-8 backdrop-blur-md"
                            style={{
                              clipPath:
                                "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))",
                            }}
                          >
                            <div className="grid grid-cols-2 gap-4">
                              {durationOptions.map((option) => (
                                <motion.div
                                  key={option.value}
                                  className={`cursor-pointer p-6 transition-all duration-300 text-center relative group ${
                                    stakeDuration === option.value
                                      ? "bg-purple-500/20 border border-purple-500/50"
                                      : "bg-black/40 border border-gray-700/50 hover:border-purple-500/30"
                                  }`}
                                  style={{
                                    clipPath:
                                      "polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)",
                                  }}
                                  onClick={() => setStakeDuration(option.value)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="font-bold text-white mb-2 font-mono">
                                    {option.label}
                                  </div>
                                  <div
                                    className={`text-sm font-bold font-mono ${
                                      stakeDuration === option.value
                                        ? "text-purple-300"
                                        : "text-purple-300/80"
                                    }`}
                                  >
                                    {option.apy} APY
                                  </div>
                                  {stakeDuration === option.value && (
                                    <motion.div
                                      className="absolute bottom-0 left-0 w-full h-1 bg-purple-500"
                                      layoutId="activeTab"
                                    />
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Input */}
                      <div>
                        <div className="mb-8">
                          <label className="block text-gray-400 font-mono text-sm tracking-wider mb-4">
                            AMOUNT TO STAKE
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={stakeAmount}
                              onChange={(e) => setStakeAmount(e.target.value)}
                              placeholder="0.0"
                              step="0.01"
                              className="w-full px-6 py-6 bg-black/60 text-white border border-purple-500/30 focus:outline-none focus:border-purple-500 backdrop-blur-md transition-all duration-300 font-mono text-lg"
                              style={{
                                clipPath:
                                  "polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)",
                              }}
                              required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                              <span className="text-gray-500 mr-3 font-mono text-sm">
                                Your Dex
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setStakeAmount(balanceData?.formatted || "0")
                                }
                                className="px-3 py-1 text-xs bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors font-mono"
                                style={{
                                  clipPath:
                                    "polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)",
                                }}
                              >
                                MAX
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mb-8">
                          <div
                            className="p-6 bg-purple-500/5 border border-purple-500/20 backdrop-blur-md"
                            style={{
                              clipPath:
                                "polygon(0 0, calc(100% - 25px) 0, 100% 25px, 100% 100%, 25px 100%, 0 calc(100% - 25px))",
                            }}
                          >
                            <div className="flex items-center mb-3">
                              <FaShieldAlt className="text-purple-300 mr-3" />
                              <span className="font-bold text-white font-mono text-sm">
                                STAKING BENEFITS
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-mono">
                              EARN REWARDS • GOVERNANCE RIGHTS • PREMIUM
                              FEATURES
                            </p>
                          </div>
                        </div>
                        {/*  */}
                        {/* Stake Button */}
                        {needsApproval ? (
                          <div className="relative group">
                            <div className="absolute inset-0 bg-purple-500/20  blur-xl group-hover:bg-purple-500/40 transition-all duration-500 "></div>
                            <motion.button
                              onClick={approveTokens}
                              disabled={isApproving}
                              // disabled={true}
                              className={`w-full py-6 font-bold relative overflow-hidden font-mono text-lg tracking-wider disabled:opacity-50 disabled:cursor-not-allowed ${
                                isApproving
                                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-blue-500 hover:to-purple-500"
                              } transition-all duration-300`}
                              style={{
                                clipPath:
                                  "polygon(30px 0, 100% 0, calc(100% - 30px) 100%, 0 100%)",
                              }}
                              whileHover={{ scale: isApproving ? 1 : 1.02 }}
                              whileTap={{ scale: isApproving ? 1 : 0.98 }}
                            >
                              {isApproving ? (
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
                                  APPROVING...
                                </span>
                              ) : (
                                <span className="flex items-center justify-center relative z-10">
                                  APPROVE
                                </span>
                              )}
                            </motion.button>
                          </div>
                        ) : (
                          <div className="relative group">
                            <div className="absolute inset-0 bg-purple-500/20  blur-xl group-hover:bg-purple-500/40 transition-all duration-500 "></div>
                            <motion.button
                              onClick={handleStake}
                              disabled={isStaking}
                              // disabled={true}
                              className={`w-full py-6 font-bold relative overflow-hidden font-mono text-lg tracking-wider disabled:opacity-50 disabled:cursor-not-allowed ${
                                isStaking
                                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-blue-500 hover:to-purple-500"
                              } transition-all duration-300`}
                              style={{
                                clipPath:
                                  "polygon(30px 0, 100% 0, calc(100% - 30px) 100%, 0 100%)",
                              }}
                              whileHover={{ scale: isStaking ? 1 : 1.02 }}
                              whileTap={{ scale: isStaking ? 1 : 0.98 }}
                            >
                              {isStaking ? (
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
                                  STAKING...
                                </span>
                              ) : (
                                <span className="flex items-center justify-center relative z-10">
                                  STAKE YOURDEX
                                  <span
                                    className="ml-4 text-sm bg-black/20 px-3 py-1 border border-purple-500/30"
                                    style={{
                                      clipPath:
                                        "polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)",
                                    }}
                                  >
                                    {calculateAPY()} APY
                                  </span>
                                </span>
                              )}
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-12">
                  <div className="flex items-center mb-8">
                    <MdOutlineWaves className="text-purple-300 mr-4 text-3xl" />
                    <h2 className="text-2xl font-bold text-white font-mono tracking-wider">
                      YOUR REWARDS
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div
                      className="bg-black/60 border border-purple-500/30 p-8 backdrop-blur-md text-center"
                      style={{
                        clipPath:
                          "polygon(25px 0, 100% 0, calc(100% - 25px) 100%, 0 100%)",
                      }}
                    >
                      <div className="text-gray-400 font-mono text-sm mb-2">
                        TOTAL STAKED
                      </div>
                      <div className="text-3xl font-bold text-white font-mono ">
                        {Number.parseFloat(totalUserStaked).toFixed(2)}{" "}
                        <span className="text-purple-300">Your Dex</span>
                      </div>
                    </div>
                    <div
                      className="bg-black/60 border border-purple-500/30 p-8 backdrop-blur-md text-center"
                      style={{
                        clipPath:
                          "polygon(0 0, calc(100% - 25px) 0, 100% 25px, 100% 100%, 0 100%)",
                      }}
                    >
                      <div className="text-gray-400 font-mono text-sm mb-2">
                        REWARDS EARNED
                      </div>
                      <div className="text-3xl font-bold text-purple-300 font-mono">
                        {Number.parseFloat(totalUserRewards).toFixed(2)} Your
                        Dex
                      </div>
                    </div>
                  </div>

                  {userStakes.length > 0 ? (
                    <div className="space-y-6">
                      {userStakes.map((stake, index) => (
                        <div
                          key={`${stake.duration}-${index}`}
                          className="bg-black/60 border border-purple-500/30 p-8 backdrop-blur-md"
                          style={{
                            clipPath:
                              "polygon(30px 0, 100% 0, calc(100% - 30px) 100%, 0 100%)",
                          }}
                        >
                          <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center">
                              <div
                                className="w-16 h-16 border border-purple-500/50 flex items-center justify-center mr-4"
                                style={{
                                  clipPath:
                                    "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                                }}
                              >
                                <FaLock className="text-purple-300 text-xl" />
                              </div>
                              <div>
                                <div className="font-bold text-white font-mono text-lg">
                                  {stake.durationLabel} STAKE
                                </div>
                                <div className="text-sm text-gray-400 font-mono">
                                  {stake.apy} APY
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-white font-mono text-lg">
                                {Number.parseFloat(
                                  stake.amountFormatted
                                ).toFixed(2)}{" "}
                                YOURDEX
                              </div>
                              <div className="text-sm text-gray-400 font-mono">
                                {stake.canUnstake ? (
                                  <span className="text-purple-300">
                                    READY TO UNSTAKE
                                  </span>
                                ) : (
                                  <span>
                                    LOCKED UNTIL{" "}
                                    {new Date(
                                      stake.endTime.toNumber() * 1000
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div
                            className="bg-black/40 border border-purple-500/20 p-4 mb-6"
                            style={{
                              clipPath:
                                "polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)",
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 font-mono text-sm">
                                PENDING REWARDS
                              </span>
                              <span className="font-bold text-purple-300 font-mono">
                                {Number.parseFloat(
                                  stake.pendingRewardsFormatted
                                ).toFixed(2)}{" "}
                                YOURDEX
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 disabled:cursor-not-allowed">
                            <motion.button
                              className={`py-4 px-6 font-mono text-sm tracking-wider relative overflow-hidden disabled:cursor-not-allowed disabled:opacity-50 ${
                                timeRemaining[index]?.totalSeconds > 0
                                  ? "bg-gray-700/80 text-gray-400 cursor-not-allowed"
                                  : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                              }`}
                              style={{
                                clipPath:
                                  "polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)",
                              }}
                              disabled={true}
                              // onClick={() =>
                              //   timeRemaining[index]?.totalSeconds === 0 &&
                              //   handleClaimRewards(index)
                              // }
                              // disabled={
                              //   timeRemaining[index]?.totalSeconds > 0 ||
                              //   isClaiming
                              // }
                              whileHover={{
                                scale:
                                  timeRemaining[index]?.totalSeconds === 0
                                    ? 1.02
                                    : 1,
                              }}
                            >
                              {timeRemaining[index]?.totalSeconds > 0 ? (
                                <span>
                                  CLAIM IN {timeRemaining[index]?.days}D{" "}
                                  {timeRemaining[index]?.hours}H{" "}
                                  {timeRemaining[index]?.minutes}M
                                </span>
                              ) : isClaiming && selectedStakeIndex === index ? (
                                "CLAIMING..."
                              ) : (
                                "CLAIM REWARDS"
                              )}
                            </motion.button>

                            <motion.button
                              className={`py-4 px-6 font-mono text-sm tracking-wider relative overflow-hidden disabled:cursor-not-allowed  disabled:opacity-50 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30`}
                              style={{
                                clipPath:
                                  "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)",
                              }}
                              onClick={() => handleUnstake(index)}
                              disabled={isUnstaking}
                              whileHover={{
                                scale: 1.02,
                              }}
                            >
                              {isUnstaking && selectedStakeIndex === index
                                ? "UNSTAKING..."
                                : "UNSTAKE"}
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="bg-black/60 border border-purple-500/30 p-12 backdrop-blur-md text-center"
                      style={{
                        clipPath:
                          "polygon(40px 0, 100% 0, calc(100% - 40px) 100%, 0 100%)",
                      }}
                    >
                      <div className="text-gray-400 mb-4 font-mono">
                        NO ACTIVE STAKES FOUND
                      </div>
                      <button
                        onClick={() => setActiveTab("stake")}
                        className="text-purple-300 font-mono text-sm hover:underline"
                      >
                        STAKE YOUR TOKENS TO START EARNING REWARDS
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Benefits Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: IoMdPulse,
              title: "EARN PASSIVE INCOME",
              desc: "EARN UP TO 40% APY ON YOUR YOURDEX TOKENS",
            },
            {
              icon: FaChartLine,
              title: "GOVERNANCE RIGHTS",
              desc: "PARTICIPATE IN PROTOCOL GOVERNANCE AND VOTING",
            },
            {
              icon: FaLock,
              title: "PREMIUM FEATURES",
              desc: "UNLOCK EXCLUSIVE FEATURES AND OPPORTUNITIES",
            },
          ].map((benefit, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 + index * 0.2 }}
              whileHover={{ y: -10 }}
            >
              <div className="absolute inset-0 bg-purple-500/5 blur-xl group-hover:bg-purple-500/10 transition-all duration-500"></div>
              <div
                className="relative bg-black/40 border border-purple-500/30 p-8 backdrop-blur-md group-hover:border-purple-500/50 transition-all duration-500"
                style={{
                  clipPath:
                    "polygon(25px 0, 100% 0, calc(100% - 25px) 100%, 0 100%)",
                }}
              >
                <div
                  className="w-16 h-16 border border-purple-500/50 flex items-center justify-center mb-6 mx-auto"
                  style={{
                    clipPath:
                      "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                  }}
                >
                  <benefit.icon className="text-purple-300 text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-white mb-4 font-mono text-center">
                  {benefit.title}
                </h3>
                <p className="text-gray-400 text-sm font-mono text-center">
                  {benefit.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StakingPage;
