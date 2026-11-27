import { AuthLeftSlider } from "@/components/AuthLeftSlider";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-surface lg:flex-row">
      {/* Left Side Panel — customize your image and left-side content here */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-panel p-12 text-white lg:flex lg:w-[46%]">
        {/* Subtle vertical dashed grid lines */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grid grid-cols-6 opacity-15"
        >
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="border-r border-dashed border-white/40 last:border-r-0"
            />
          ))}
        </div>

        {/* Left Image Slot — replace with your <Image /> or <img /> */}
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="flex h-72 w-full max-w-sm items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/5 p-6 text-center">
            <p className="text-sm text-white/70">
              Add your left-side illustration or image here
            </p>
          </div>
        </div>

        {/* Bottom Caption Slider */}
        <AuthLeftSlider />
      </div>

      {/* Right Side Dynamic Content */}
      <main className="flex flex-1 items-center justify-center bg-surface px-6 py-12 sm:px-12">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
