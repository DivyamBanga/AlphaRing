export default function Footer() {
  return (
    <footer className="border-t border-[#1A1A1A] py-8 px-4">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-[10px] text-[#444] uppercase tracking-wider max-w-md leading-relaxed">
          Not financial advice. Historical backtests do not predict future returns.
          All data is simulated for educational purposes.
        </p>
        <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.15em]">
          <a
            href="https://github.com/DivyamBanga/AlphaRing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#444] hover:text-accent transition-colors"
          >
            GitHub
          </a>
          <span className="text-[#333]">
            Built by <span className="text-[#555]">DivCodes</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
