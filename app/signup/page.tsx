"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanedName = name.trim();
    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPassword = password.trim();

    if (!cleanedName || !cleanedEmail || !cleanedPassword) return;

    if (!cleanedEmail.endsWith("@intoaec.ai")) {
      setEmailError("Email must end with @intoaec.ai");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: cleanedName, email: cleanedEmail, password: cleanedPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to sign up");
      } else {
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify({ name: cleanedName, email: cleanedEmail }));
        }
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col md:flex-row bg-white ${poppins.variable} font-sans`}>
      {/* Left Section - Illustration */}
      <div className="w-full md:flex-1 flex items-center justify-center p-8 md:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-[400px] lg:max-w-[480px] flex flex-col items-center justify-center">
          <div className="relative w-full aspect-square max-h-[280px] md:max-h-[420px] transition-transform duration-500 hover:scale-[1.02]">
            <Image
              src="/login_illustration.png"
              alt="Person working on computer illustration"
              fill
              priority
              className="object-contain"
              sizes="(max-width: 768px) 280px, 480px"
            />
          </div>
        </div>
      </div>

      {/* Right Section - Signup Card */}
      <div className="w-full md:flex-1 bg-[#1976D2] flex items-center justify-center p-6 sm:p-8 md:p-12 relative overflow-hidden min-h-[600px] md:min-h-screen">

        {/* Background Decorations (Light curved outline circles) */}
        <div className="absolute bottom-0 right-0 overflow-hidden w-72 h-72 sm:w-96 sm:h-96 pointer-events-none select-none">
          <div className="absolute -bottom-10 -right-10 w-80 h-80 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -right-24 w-[380px] h-[380px] rounded-full border border-white/15" />
          <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full border border-white/5" />
        </div>

        {/* Top-left subtle circle design for added visual flavor */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full border border-white/5 pointer-events-none select-none" />

        {/* Signup Card */}
        <div className="w-full max-w-[380px] bg-white rounded-xl shadow-xl shadow-black/15 p-8 sm:p-10 z-10 transition-all duration-300 hover:shadow-2xl">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
              Hello!
            </h1>
            <p className="text-sm font-medium text-gray-500">
              Sign up to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-xs text-red-600 bg-red-50 rounded-lg text-center font-medium border border-red-200">
                {error}
              </div>
            )}

            {/* Name Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/25 outline-none transition-all duration-200 placeholder:text-gray-400 text-gray-700 text-sm"
              />
            </div>

            {/* Email Input */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  placeholder="Email Address"
                  className={`w-full pl-12 pr-4 py-3 rounded-full border ${
                    emailError
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/25"
                      : "border-gray-300 focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/25"
                  } outline-none transition-all duration-200 placeholder:text-gray-400 text-gray-700 text-sm`}
                />
              </div>
              {emailError && (
                <p className="text-red-500 text-[11px] font-medium mt-1 ml-4 animate-fade-in">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-12 pr-12 py-3 rounded-full border border-gray-300 focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/25 outline-none transition-all duration-200 placeholder:text-gray-400 text-gray-700 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-full bg-[#1976D2] hover:bg-[#1565C0] active:scale-[0.98] text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign Up
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center text-xs font-medium text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#1976D2] hover:text-[#1565C0] hover:underline transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
