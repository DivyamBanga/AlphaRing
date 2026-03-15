import Hero from "@/components/landing/Hero";
import LeaderboardPreview from "@/components/landing/LeaderboardPreview";
import HowItWorks from "@/components/landing/HowItWorks";
import ExampleStrategies from "@/components/landing/ExampleStrategies";

export default function Home() {
  return (
    <>
      <Hero />
      <LeaderboardPreview />
      <HowItWorks />
      <ExampleStrategies />
    </>
  );
}
