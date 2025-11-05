import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FaucetPage from "./pages/FaucetPage";
import StakePage from "./pages/StakePage";
function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route index path="/" element={<Home />} />
        <Route path="/faucet" element={<FaucetPage />} />
        <Route path="/stake" element={<StakePage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
