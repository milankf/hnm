import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const WISHLIST_ITEMS = [
  "4 bread toaster",
  "Microwave",
  "Induction stove",
  "Coffee maker",
  "Air purifier",
  "Air fryer",
  "Pan set",
  "Shower heater",
  "Handheld vacuum",
  "Stand mixer",
  "Robot vacuum",
  "Yankee candles",
  "Wifi printer",
  "Speaker (sound system)",
  "Standing table",
];

const PLACEHOLDER_THEMES = [
  "from-rose-200 to-rose-100",
  "from-amber-200 to-yellow-100",
  "from-emerald-200 to-emerald-100",
  "from-cyan-200 to-sky-100",
  "from-violet-200 to-fuchsia-100",
];

export default function WishlistPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f4f1ea] via-[#efe9df] to-[#e6ded1] px-5 py-10 sm:px-8 sm:py-14">
      <section className="mx-auto w-full max-w-6xl">
        <header className="mb-8 text-center sm:mb-10">
          <div className="mb-5 flex justify-center">
            <Link href="/#wishlist" className={buttonVariants()}>
              Back to wishlist section
            </Link>
          </div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-neutral-600">
            Kristoffer and Aubrey
          </p>
          <h1 className="mt-2 font-mono text-4xl font-extrabold tracking-[0.06em] text-neutral-900 sm:text-6xl">
            Wishlist
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-mono text-sm text-neutral-700 sm:text-base">
            We&apos;re grateful for your love and support. Here are the items we&apos;re currently wishing for.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WISHLIST_ITEMS.map((item, index) => (
            <article
              key={item}
              className="overflow-hidden rounded-2xl border border-black/10 bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm"
            >
              <div
                className={`relative aspect-[4/3] bg-gradient-to-br ${
                  PLACEHOLDER_THEMES[index % PLACEHOLDER_THEMES.length]
                }`}
              >
                <div
                  className="absolute inset-0 opacity-35"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.9), transparent 32%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.7), transparent 35%)",
                  }}
                />
                <p className="absolute left-3 top-3 rounded-sm bg-black/55 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
                  Placeholder photo
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="font-mono text-base font-semibold text-neutral-900 sm:text-lg">{item}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
