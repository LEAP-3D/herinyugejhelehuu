"use client";

export default function Page() {
  return (
    <>
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url("/image 12 (4).png")` }}
      />

      <div className="absolute inset-0 bg-black/10 z-0" />

      {/* Overlay (энэ нь бүүдгэр болгодог) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-120"
        style={{ backgroundImage: `url("/MacBook Pro 14_ - 2 (4).png")` }}
      />
    </>
  );
}
