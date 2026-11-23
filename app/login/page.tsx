"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  ShieldCheck,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to sign in.");
        setIsLoading(false);
        return;
      }

      router.replace("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F7F3] px-4 py-12 sm:px-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 size-125 rounded-full bg-[#E9E2D2]/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 size-150 rounded-full bg-[#DCE3E8]/50 blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-[#E9E5DC] bg-white shadow-[0_25px_80px_-30px_rgba(25,39,54,0.18)]">
        <div className="grid md:grid-cols-2">
          {/* Left branding panel */}
          <div className="relative hidden min-h-155 flex-col justify-between overflow-hidden bg-[#172C3D] p-10 text-white md:flex lg:p-12">
            <div className="absolute -right-32 -top-20 size-100 rounded-full border border-white/10" />
            <div className="absolute -right-20 -top-8 size-75 rounded-full border border-white/10" />
            <div className="absolute -bottom-32 -left-24 size-100 rounded-full bg-[#C6A76B]/10 blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl border border-[#D3B77F]/40 bg-[#D3B77F]/10">
                  <Sparkles size={23} className="text-[#D3B77F]" />
                </div>

                <div>
                  <p className="text-lg font-semibold tracking-wide">MAITRI</p>
                  <p className="text-[10px] font-medium tracking-[0.28em] text-[#D3B77F]">
                    GLOBAL EDUCATION
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 max-w-sm">
              <div className="mb-5 h-px w-12 bg-[#D3B77F]" />

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D3B77F]">
                Admin workspace
              </p>

              <h1 className="mt-5 text-4xl font-medium leading-[1.2] tracking-tight lg:text-5xl">
                Empowering
                <br />
                futures through
                <br />
                <span className="font-serif italic text-[#D3B77F]">
                  education.
                </span>
              </h1>

              <p className="mt-6 text-sm leading-7 text-slate-300">
                Your central workspace to manage content, student enquiries, and
                the digital experience of Maitri Global Education.
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6">
              <p className="text-xs text-slate-400">MAITRI GLOBAL EDUCATION</p>
              <ShieldCheck size={19} className="text-[#D3B77F]" />
            </div>
          </div>

          {/* Login panel */}
          <div className="flex min-h-155 flex-col justify-center px-6 py-12 sm:px-12 lg:px-14">
            {/* Mobile branding */}
            <div className="mb-12 flex items-center gap-3 md:hidden">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#172C3D] text-[#D3B77F]">
                <Sparkles size={22} />
              </div>

              <div>
                <p className="text-base font-bold tracking-wide text-[#172C3D]">
                  MAITRI
                </p>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[#A48752]">
                  GLOBAL EDUCATION
                </p>
              </div>
            </div>

            <div className="mb-9">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8E0D1] bg-[#FAF8F3] px-3 py-1.5 text-xs font-medium text-[#927849]">
                <span className="size-1.5 rounded-full bg-[#B89A62]" />
                Secure administrator access
              </div>

              <h2 className="text-3xl font-semibold tracking-tight text-[#172C3D]">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#858585]">
                Sign in to continue to your Maitri workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-[#344454]"
                >
                  Username
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A6A49F]"
                  />

                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    minLength={3}
                    maxLength={30}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    className="w-full rounded-xl border border-[#E7E4DD] bg-[#FDFCFA] py-3.5 pl-11 pr-4 text-sm text-[#172C3D] outline-none transition placeholder:text-[#B4B1AA] hover:border-[#D5C8AE] focus:border-[#B89A62] focus:ring-4 focus:ring-[#B89A62]/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-[#344454]"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A6A49F]"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-[#E7E4DD] bg-[#FDFCFA] py-3.5 pl-11 pr-12 text-sm text-[#172C3D] outline-none transition placeholder:text-[#B4B1AA] hover:border-[#D5C8AE] focus:border-[#B89A62] focus:ring-4 focus:ring-[#B89A62]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#A6A49F] transition hover:text-[#172C3D]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#172C3D] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-[#223F54] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to workspace
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 border-t border-[#EEECE6] pt-6">
              <div className="flex items-center justify-center gap-2 text-xs text-[#A09D95]">
                <ShieldCheck size={14} />
                Protected administrator access
              </div>

              <p className="mt-3 text-center text-[11px] text-[#B2AFA8]">
                © {new Date().getFullYear()} Maitri Global Education. All rights
                reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
