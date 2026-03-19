import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://alpharing.vercel.app";

  try {
    const res = await fetch(`${siteUrl}/api/strategy/${id}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error("Strategy not found");

    const data = await res.json();

    const returnDisplay =
      data.returnPct >= 0
        ? `+${data.returnPct.toFixed(1)}%`
        : `${data.returnPct.toFixed(1)}%`;

    const title = `${data.name} — ${data.grade} Grade | AlphaRing`;
    const description = `${data.name} by ${data.creator} scored ${data.compositeScore}/100 with ${returnDisplay} return over 10 years. ${data.sharpeRatio.toFixed(2)} Sharpe ratio. Can you beat it on AlphaRing?`;
    const ogImage = `${siteUrl}/api/og/${id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `${siteUrl}/strategy/${id}`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${data.name} strategy results`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: "Strategy | AlphaRing",
      description:
        "View this trading strategy's backtest results on AlphaRing.",
      openGraph: {
        title: "Strategy | AlphaRing",
        description:
          "View this trading strategy's backtest results on AlphaRing.",
        images: [
          {
            url: `${siteUrl}/api/og/${id}`,
            width: 1200,
            height: 630,
            alt: "AlphaRing Strategy",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Strategy | AlphaRing",
        description:
          "View this trading strategy's backtest results on AlphaRing.",
        images: [`${siteUrl}/api/og/${id}`],
      },
    };
  }
}

export default function StrategyLayout({ children }: Props) {
  return <>{children}</>;
}
