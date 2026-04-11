import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const WISHLIST_CATEGORIES = [
  {
    title: "Kitchen & appliances",
    items: [
      "Bread toaster",
      "Microwave",
      "Induction stove",
      "Coffee maker",
      "Stand mixer",
      "Pots & pans",
      "Air fryer",
    ],
  },
  {
    title: "Electronic & games",
    items: ["Wifi printer", "Speaker (sound system)", "Standing table"],
  },
  {
    title: "Home essentials",
    items: ["Air purifier", "Handheld vacuum", "Robot vacuum", "Humidifier"],
  },
  {
    title: "Bathroom",
    items: ["Shower heater", "Bathrobes"],
  },
  {
    title: "Luggage & travel",
    items: ["Luggage set", "Carry-on bag", "Tracker"],
  },
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
          {WISHLIST_CATEGORIES.map((category) => (
            <article
              key={category.title}
              className="rounded-2xl border border-black/10 bg-white/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:p-6"
            >
              <h2 className="font-mono text-lg font-extrabold uppercase tracking-[0.08em] text-neutral-900 sm:text-xl">
                {category.title}
              </h2>
              <ul className="mt-4 space-y-2">
                {category.items.map((item) => (
                  <li key={item} className="font-mono text-sm text-neutral-800 sm:text-base">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
