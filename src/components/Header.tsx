import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppKit, useDisconnect } from "@reown/appkit/react";
import { useBalance, useAccount } from "wagmi";
// Memoized wallet info component to prevent unnecessary re-renders
const WalletInfo = memo(
  ({
    address,
    balance,
    formatWalletAddress,
  }: {
    address: string;
    balance: any;
    formatWalletAddress: (address: string) => string;
  }) => {
    console.log("balance", balance);
    return (
      <div className="flex items-center space-x-2 bg-[#65ffe9]/20 border border-[#65ffe9]/10 rounded-full px-3 py-1 ">
        <div className=" text-sm text-[#65ffe9] tracking-wide">
          {formatWalletAddress(address)}
        </div>
        <span className="text-sm text-[#65ffe9] tracking-wide">|</span>
        <div className="text-sm font-semibold text-[#65ffe9] drop-shadow-[0_0_8px_rgba(101,255,255,0.3)]">
          {balance
            ? `${Number(balance?.formatted).toFixed(4)} ${balance.symbol}`
            : "0.0000"}
        </div>
      </div>
    );
  }
);
const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { open, close } = useAppKit();
  const { chain, isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  // Format wallet address to show only first and last few characters - memoized
  const formatWalletAddress = useCallback((address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  }, []);
  const { data: balance } = useBalance({
    address,
    chainId: chain?.id,
  });

  // Handle wallet connection/disconnection - memoized
  const handleWalletConnect = useCallback(async () => {
    if (isConnected) {
      close();
    } else {
      open();
    }
  }, [isConnected, close, open]);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Faucet", path: "/faucet" },
    { name: "Stake", path: "/stake" },
  ];

  return (
    <header
      className={`sticky top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#01221f]/90 backdrop-blur-md shadow-lg shadow-[#65ffe9]/10"
          : "bg-[#01221f]"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#65ffe9] leading-tight">
              Your DEX
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="px-4 py-2 text-white hover:text-[#65ffe9] transition-colors relative group"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#65ffe9] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            {isConnected ? (
              <div className="hidden lg:flex items-center">
                {address && (
                  <div className="mr-4">
                    <WalletInfo
                      address={address}
                      balance={balance}
                      formatWalletAddress={formatWalletAddress}
                    />
                  </div>
                )}

                <button
                  onClick={() => disconnect()}
                  className="group relative inline-flex items-center justify-center px-4 py-2 text-sm text-[#01221f] font-medium overflow-hidden rounded-full bg-gradient-to-r from-[#65ffe9] to-[#65ffe9]/80 hover:from-[#65ffe9]/90 hover:to-[#65ffe9]/70 transition-all duration-300 shadow-md hover:shadow-[#65ffe9]/20"
                >
                  <span className="relative flex items-center gap-1">
                    Disconnect
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#65ffe9]/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-in-out"></span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleWalletConnect}
                className="group relative inline-flex items-center justify-center px-4 py-2 text-sm text-[#01221f] font-medium overflow-hidden rounded-full bg-gradient-to-r from-[#65ffe9] to-[#65ffe9]/80 hover:from-[#65ffe9]/90 hover:to-[#65ffe9]/70 transition-all duration-300 shadow-md hover:shadow-[#65ffe9]/20"
              >
                <span className="relative flex items-center gap-1">
                  Connect Wallet
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#65ffe9]/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-in-out"></span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white hover:text-[#65ffe9] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 py-4 border-t border-[#65ffe9]/20 animate-fadeIn bg-[#01221f]">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="px-2 py-2 text-white hover:text-[#65ffe9] transition-colors flex items-center justify-between"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ))}
              {address && (
                <div className="mr-4 text-center">
                  <WalletInfo
                    address={address}
                    balance={balance}
                    formatWalletAddress={formatWalletAddress}
                  />
                </div>
              )}
              {isConnected ? (
                <button
                  onClick={() => disconnect()}
                  className="mt-2 w-full group relative inline-flex items-center justify-center px-4 py-2 text-sm text-[#01221f] font-medium overflow-hidden rounded-full bg-gradient-to-r from-[#65ffe9] to-[#65ffe9]/80 hover:from-[#65ffe9]/90 hover:to-[#65ffe9]/70 transition-all duration-300 shadow-md hover:shadow-[#65ffe9]/20"
                >
                  <span className="relative flex items-center justify-center gap-1 w-full">
                    Disconnect
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleWalletConnect}
                  className="mt-2 w-full group relative inline-flex items-center justify-center px-4 py-2 text-sm text-[#01221f] font-medium overflow-hidden rounded-full bg-gradient-to-r from-[#65ffe9] to-[#65ffe9]/80 hover:from-[#65ffe9]/90 hover:to-[#65ffe9]/70 transition-all duration-300 shadow-md hover:shadow-[#65ffe9]/20"
                >
                  <span className="relative flex items-center justify-center gap-1 w-full">
                    Connect Wallet
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Decorative element */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#65ffe9]/30 to-transparent"></div>
    </header>
  );
};

export default Header;
