"use client";
import { useRouter } from "next/navigation";
import Page from "./Home-page/page";
export default function HomeMenu() {
  const router = useRouter();
  const handleMoreButton = () => {
    router.push("/Home-page/Player");
  };
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <Page />
      <button
        className="transition active:translate-y-1"
        onClick={handleMoreButton}
      ></button>
    </main>
  );
}
