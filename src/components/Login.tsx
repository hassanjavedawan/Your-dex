import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Open the AppKit modal for wallet connection
      await open();
      setTimeout(() => {
        if (!isConnected) {
          setIsLoading(false);
        }
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      {/* Decorative elements */}
      <div
        className="absolute top-20 left-20 w-64 h-64 rounded-full bg-purple-500/5"
        style={{ filter: "blur(80px)" }}
      ></div>

      <div
        className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-purple-500/10"
        style={{ filter: "blur(100px)" }}
      ></div>
      
      {/* Futuristic grid lines */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full border border-purple-500/10 rounded-full transform scale-150"></div>
        <div className="absolute top-0 left-0 w-full h-full border border-purple-500/5 rounded-full transform scale-125"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-purple-500/30 to-transparent"></div>
      </div>
      
      {/* Animated hexagon grid */}
      <div className="absolute top-0 right-0 w-[80%] h-[80%] border border-purple-500/20 rounded-full transform translate-x-1/3 -translate-y-1/4"></div>
      <div className="absolute bottom-0 left-0 w-[60%] h-[60%] border border-purple-500/10 rounded-full transform -translate-x-1/3 translate-y-1/4"></div>
      
      {/* Animated particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-purple-500/80 animate-float"></div>
      <div className="absolute top-3/4 right-1/4 w-1 h-1 rounded-full bg-purple-500/60 animate-float" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 rounded-full bg-purple-500/70 animate-float" style={{ animationDelay: "1.5s" }}></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-purple-500/20 p-8 shadow-xl shadow-black/20 overflow-hidden relative">
          {/* Glowing accent */}
          <div
            className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10"
            style={{ filter: "blur(40px)" }}
          ></div>
          
          {/* Hexagon pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4NiIgaGVpZ2h0PSI0OSI+PHBhdGggZmlsbD0iIzY1ZmZlOSIgZmlsbC1vcGFjaXR5PSIwLjQiIGQ9Ik0wIDQyLjM4NTl2LTM1Ljc3MThsMzAuOTk0MSAtMTcuODg1OWwzMC45OTQxIDE3Ljg4NTl2MzUuNzcxOGwtMzAuOTk0MSAxNy44ODU5eiI+PC9wYXRoPjwvc3ZnPg==')] bg-repeat"></div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-purple-300/80">Your Dex</span>
            </h2>
            <p className="text-purple-300/70">Connect your wallet to continue</p>
            <div className="h-0.5 w-24 bg-gradient-to-r from-purple-500 to-transparent mx-auto mt-3"></div>
          </div>

          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full bg-purple-500/10 animate-pulse"
                style={{ filter: "blur(15px)" }}
              ></div>
              <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full animate-spin-slow opacity-70"></div>
              <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center relative overflow-hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-purple-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-transparent animate-spin-slow opacity-70"></div>
              </div>
            </div>
          </div>

          {/* Connect wallet button */}
          <div className="relative mb-2">
            {/* Button highlight effects */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-purple-500/5 to-purple-500/20 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-purple-500/5"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50"></div>
            </div>
            
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className={`relative group w-full flex justify-center py-4 px-6 border border-purple-500/30 rounded-full shadow-lg shadow-purple-500/10 text-base font-medium text-white bg-gradient-to-r from-purple-500 to-purple-500/80 hover:shadow-xl hover:shadow-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-0 transition-all duration-300 overflow-hidden ${
                isLoading ? "opacity-80 cursor-not-allowed" : ""
              }`}
            >
              <span className="relative z-10 flex items-center">
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Wallet
                    <ArrowRight
                      size={18}
                      className="ml-2 transform group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </span>
              {!isLoading && (
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-in-out"></span>
              )}
            </button>
          </div>

          {/* Futuristic divider */}
          <div className="relative my-6 flex items-center">
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
            <div className="mx-2 w-2 h-2 rounded-full bg-purple-500/50 animate-pulse-slow"></div>
            <div className="flex-grow h-px bg-gradient-to-r from-purple-500/30 via-transparent to-transparent"></div>
          </div>

          {/* Additional info with futuristic styling */}
          <div className="text-center">
            <p className="text-sm text-purple-300/60 backdrop-blur-sm py-2 px-4 rounded-lg inline-block border border-purple-500/10">
              By connecting, you agree to our Terms of Service
            </p>
          </div>

          {/* Animated tech elements */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce-slow"></div>
            <div
              className="w-2 h-2 rounded-full bg-purple-500 animate-bounce-slow"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 rounded-full bg-purple-500 animate-bounce-slow"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>
          
          {/* Tech circuit lines */}
          <div className="absolute bottom-0 left-0 w-full h-8 overflow-hidden opacity-30">
            <div className="absolute bottom-0 left-1/4 w-px h-8 bg-gradient-to-t from-purple-500 to-transparent"></div>
            <div className="absolute bottom-0 left-2/4 w-px h-12 bg-gradient-to-t from-purple-500 to-transparent"></div>
            <div className="absolute bottom-0 left-3/4 w-px h-6 bg-gradient-to-t from-purple-500 to-transparent"></div>
          </div>
        </div>
        
        {/* Footer with tech styling */}
        <div className="mt-8 text-center relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-px h-4 bg-gradient-to-b from-purple-500/30 to-transparent"></div>
          <p className="text-xs text-purple-300/40 tracking-wider">
            Your DEX SYSTEM <span className="mx-2">|</span> v2.5.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
