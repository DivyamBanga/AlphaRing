import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

function gradeToColor(grade: string): string {
  if (grade.startsWith("A")) return "#00E57A";
  if (grade.startsWith("B")) return "#C5FF00";
  if (grade === "C") return "#F97316";
  if (grade === "D") return "#F97316";
  return "#FF3D3D";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Build absolute URL from request headers
  const host = request.headers.get("host") || "alpharing.vercel.app";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  let strategyData: {
    name: string;
    grade: string;
    returnPct: number;
    sharpeRatio: number;
    compositeScore: number;
    creator: string;
  } | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/strategy/${id}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      strategyData = {
        name: data.name,
        grade: data.grade,
        returnPct: data.returnPct,
        sharpeRatio: data.sharpeRatio,
        compositeScore: data.compositeScore,
        creator: data.creator,
      };
    }
  } catch {
    // fall through to generic card
  }

  const accentColor = "#C5FF00";
  const bgColor = "#080808";
  const surfaceColor = "#111111";
  const borderColor = "#1E1E1E";
  const mutedColor = "#444444";

  if (!strategyData) {
    // Generic AlphaRing branding card
    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            background: bgColor,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: accentColor,
              letterSpacing: "-2px",
            }}
          >
            AlphaRing
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#666666",
              marginTop: "16px",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Describe a strategy. Watch it compete.
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const gradeColor = gradeToColor(strategyData.grade);
  const returnPositive = strategyData.returnPct >= 0;
  const returnDisplay = `${returnPositive ? "+" : ""}${strategyData.returnPct.toFixed(1)}%`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: bgColor,
          display: "flex",
          flexDirection: "column",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 900,
              color: accentColor,
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            AlphaRing
          </div>
          <div
            style={{
              fontSize: "12px",
              color: mutedColor,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            10-Year Backtest
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", gap: "48px", flex: 1 }}>
          {/* Left: name + creator + description */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: mutedColor,
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              by {strategyData.creator}
            </div>
            <div
              style={{
                fontSize: "52px",
                fontWeight: 900,
                color: "#FFFFFF",
                lineHeight: 1.1,
                letterSpacing: "-1px",
              }}
            >
              {strategyData.name}
            </div>
          </div>

          {/* Right: grade + stats */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              justifyContent: "center",
              minWidth: "300px",
            }}
          >
            {/* Grade badge */}
            <div
              style={{
                width: "120px",
                height: "120px",
                border: `3px solid ${gradeColor}`,
                background: `${gradeColor}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "flex-start",
              }}
            >
              <span
                style={{
                  fontSize: "64px",
                  fontWeight: 900,
                  color: gradeColor,
                }}
              >
                {strategyData.grade}
              </span>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Return */}
              <div
                style={{
                  background: surfaceColor,
                  border: `1px solid ${borderColor}`,
                  padding: "14px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: mutedColor,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                  }}
                >
                  Total Return
                </div>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: 900,
                    color: returnPositive ? "#00E57A" : "#FF3D3D",
                  }}
                >
                  {returnDisplay}
                </div>
              </div>

              {/* Sharpe + Score row */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div
                  style={{
                    flex: 1,
                    background: surfaceColor,
                    border: `1px solid ${borderColor}`,
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: mutedColor,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                    }}
                  >
                    Sharpe
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "#FFFFFF",
                    }}
                  >
                    {strategyData.sharpeRatio.toFixed(2)}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: surfaceColor,
                    border: `1px solid ${borderColor}`,
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: mutedColor,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                    }}
                  >
                    Score
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 700,
                      color: accentColor,
                    }}
                  >
                    {strategyData.compositeScore}/100
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "40px",
            paddingTop: "20px",
            borderTop: `1px solid ${borderColor}`,
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: mutedColor,
              letterSpacing: "1px",
            }}
          >
            Can you beat it?
          </div>
          <div
            style={{
              fontSize: "13px",
              color: accentColor,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            alpharing.vercel.app
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
