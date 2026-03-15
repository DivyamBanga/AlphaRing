export default function Footer() {
  return (
    <footer className="relative py-10 px-4">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-surface-border/60 to-transparent" />

      <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p className="max-w-lg">
          AlphaRing is not financial advice. All backtesting uses historical
          data. Past performance does not predict future results.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/DivyamBanga/AlphaRing"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            GitHub
          </a>
          <span className="text-gray-600">
            Built by{" "}
            <span className="text-gray-400">DivCodes</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
