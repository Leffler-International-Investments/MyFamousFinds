{/* LINK PILLS – FULL WIDTH, RESPONSIVE WRAP */}
<nav className="w-full flex justify-center">
  <div className="w-full max-w-6xl flex flex-wrap justify-center gap-x-8 gap-y-4">

    {/* REMOVED: Help Center */}
    {/* REMOVED: About */}
    {/* REMOVED: Contact */}
    {/* REMOVED: Returns */}

    <Link
      href="/buying"
      className="inline-flex items-center justify-center rounded-full border border-blue-400/60 px-4 py-1.5 text-xs sm:text-[13px] text-blue-300 hover:bg-blue-500/10 hover:border-blue-300 hover:text-blue-100 transition-colors"
    >
      Buying
    </Link>

    <Link
      href="/selling"
      className="inline-flex items-center justify-center rounded-full border border-blue-400/60 px-4 py-1.5 text-xs sm:text-[13px] text-blue-300 hover:bg-blue-500/10 hover:border-blue-300 hover:text-blue-100 transition-colors"
    >
      Selling
    </Link>

    <Link
      href="/shipping"
      className="inline-flex items-center justify-center rounded-full border border-blue-400/60 px-4 py-1.5 text-xs sm:text-[13px] text-blue-300 hover:bg-blue-500/10 hover:border-blue-300 hover:text-blue-100 transition-colors"
    >
      Shipping
    </Link>

    <Link
      href="/authenticity-policy"
      className="inline-flex items-center justify-center rounded-full border border-blue-400/60 px-4 py-1.5 text-xs sm:text-[13px] text-blue-300 hover:bg-blue-500/10 hover:border-blue-300 hover:text-blue-100 transition-colors"
    >
      Authenticity
    </Link>

    <Link
      href="/privacy"
      className="inline-flex items-center justify-center rounded-full border border-blue-400/60 px-4 py-1.5 text-xs sm:text-[13px] text-blue-300 hover:bg-blue-500/10 hover:border-blue-300 hover:text-blue-100 transition-colors"
    >
      Privacy
    </Link>

  </div>
</nav>
