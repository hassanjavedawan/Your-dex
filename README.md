# Your DEX - Decentralized Exchange Protocol

A modern, feature-rich decentralized exchange (DEX) built with React, TypeScript, and Web3 technologies. Your DEX enables seamless token swaps, staking, and faucet distribution on the Base Sepolia testnet.

## 🌟 Features

- **Token Swaps**: Trade tokens directly with competitive pricing
- **Staking Protocol**: Earn rewards by staking Your DEX tokens with flexible lock periods (1 week to 2 years)
- **Faucet Distribution**: Claim test tokens for protocol testing
- **Governance**: Participate in protocol governance through staking
- **Modern UI**: Beautiful, responsive interface with purple/blue gradient theme
- **Web3 Integration**: Full wallet connectivity with Wagmi and ethers.js
- **Real-time Updates**: Live balance and reward calculations

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- MetaMask or compatible Web3 wallet
- Base Sepolia testnet configured in your wallet

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd your-dex
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## 📋 Project Structure

```
src/
├── pages/
│   ├── Home.jsx           # Landing page with hero and features
│   ├── FaucetPage.tsx     # Faucet distribution interface
│   └── StakePage.tsx      # Staking interface with rewards
├── components/
│   ├── Header.tsx         # Navigation header
│   ├── Footer.tsx         # Footer with links
│   ├── Login.tsx          # Wallet connection
│   └── LoadingSpinner.tsx # Loading indicator
├── abi/
│   ├── Token.json         # ERC20 token ABI
│   ├── Staking.json       # Staking contract ABI
│   └── Faucet.json        # Faucet contract ABI
├── utils/                 # Utility functions
├── App.jsx                # Main app component
├── main.jsx               # Entry point
└── index.css              # Global styles
```

## 🎨 Theme & Styling

The application uses a modern purple-to-blue gradient color scheme:

- **Primary Gradient**: Purple-500 to Blue-500
- **Text Accents**: Purple-300
- **Background**: Slate-950
- **Borders**: Purple-500 with opacity

Built with:
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Lucide Icons**: Modern icon library

## 🔗 Smart Contracts

### Supported Networks
- **Base Sepolia Testnet** (Primary)

### Contract Addresses
- **Token (Your DEX)**: `0x72e136481c621beA429F6F70C6b770FfE0EB1147`
- **Staking Contract**: `0x0bF726f313F4Ac7F3969696B540BCe651629A56C`
- **Faucet Contract**: Available in contract ABI

### Staking Durations & APY
| Duration | APY |
|----------|-----|
| 1 Week | 10% |
| 4 Weeks | 18% |
| 12 Weeks | 21% |
| 24 Weeks | 24% |
| 52 Weeks | 30% |
| 2 Years | 40% |

## 💻 Available Scripts

### Development
```bash
npm run dev
```
Runs the app in development mode with hot module replacement.

### Build
```bash
npm run build
```
Builds the app for production to the `dist` folder.

### Preview
```bash
npm run preview
```
Preview the production build locally.

### Lint
```bash
npm run lint
```
Run ESLint to check code quality.

## 🔐 Security Features

- **Wallet Integration**: Secure connection via Wagmi
- **Transaction Validation**: All transactions validated before submission
- **Approval System**: Token approval required before staking
- **Error Handling**: Comprehensive error messages and recovery

## 📦 Dependencies

### Core
- **React 18**: UI library
- **React Router**: Navigation
- **TypeScript**: Type safety

### Web3
- **Wagmi**: React hooks for Web3
- **ethers.js**: Ethereum library
- **viem**: Ethereum utilities

### UI & Animation
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations
- **Lucide React**: Icons
- **React Icons**: Additional icons

### Development
- **Vite**: Build tool
- **ESLint**: Code linting

## 🎯 Usage Guide

### Connecting Wallet
1. Click "Connect Wallet" in the header
2. Select MetaMask or your Web3 wallet
3. Approve the connection request
4. Ensure you're on Base Sepolia testnet

### Using the Faucet
1. Navigate to the Faucet page
2. Click "Claim Tokens"
3. Wait for the transaction to confirm
4. Tokens will appear in your wallet

### Staking Tokens
1. Go to the Stake page
2. Select a staking duration (1 week to 2 years)
3. Enter the amount to stake
4. Click "Stake Your DEX"
5. Approve the transaction in your wallet
6. Monitor your rewards in real-time

### Claiming Rewards
1. Navigate to the Rewards tab on the Stake page
2. View your active stakes and pending rewards
3. Click "Claim Rewards" when available
4. Confirm the transaction

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure MetaMask is installed and unlocked
- Verify you're on the Base Sepolia testnet
- Try refreshing the page

### Transaction Failures
- Check your wallet balance
- Ensure sufficient gas fees
- Verify contract addresses are correct

### Staking Issues
- Approve token spending first
- Wait for previous transactions to complete
- Check lock period hasn't expired

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on the repository.

## 🔄 Recent Updates

- ✅ Updated color scheme to purple/blue gradient
- ✅ Implemented modern landing page
- ✅ Enhanced staking interface
- ✅ Improved faucet distribution
- ✅ Added responsive design
- ✅ Integrated Framer Motion animations

---

**Built with ❤️ for the Web3 community**
