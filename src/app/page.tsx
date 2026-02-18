import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import ApiDemo from "@/components/ApiDemo";
import Buyers from "@/components/Buyers";
import Market from "@/components/Market";
import Competitive from "@/components/Competitive";
import Pricing from "@/components/Pricing";
import Architecture from "@/components/Architecture";
import GoToMarket from "@/components/GoToMarket";
import Risks from "@/components/Risks";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <ApiDemo />
        <Buyers />
        <Market />
        <Competitive />
        <Pricing />
        <Architecture />
        <GoToMarket />
        <Risks />
      </main>
      <Footer />
    </>
  );
}
