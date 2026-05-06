import { useState, useEffect, MouseEvent } from "react"
import { cn } from "../lib/utils"

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollToCalculator = (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const el = document.getElementById("calculator")
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <header
      className={cn(
        "fixed z-50 transition-all duration-500 my-0 py-0 rounded-none",
        scrolled || mobileMenuOpen
          ? "bg-primary backdrop-blur-md py-4 top-4 left-4 right-4 rounded-2xl"
          : "bg-transparent py-4 top-0 left-0 right-0",
      )}
    >
      <nav className="container mx-auto px-6 flex items-center justify-between md:px-[24]">
        <a href="/" className="flex items-center gap-2 group" onClick={scrollToTop}>
          <img src="https://cdn.poehali.dev/projects/47894456-eccd-4236-bbf3-c14775d7fbbb/bucket/f27c1960-dd4d-464a-9119-e4f99dc8d20d.jpg" alt="Доступный офисный фонд" className="w-auto h-10 object-contain" />
        </a>

        <a
          href="#calculator"
          onClick={scrollToCalculator}
          className="hidden md:inline-flex items-center gap-2 text-sm px-5 py-2.5 transition-all duration-300 bg-white text-foreground border border-foreground/20 hover:bg-foreground hover:text-white"
        >
          Контакты
        </a>

        <button
          className="md:hidden z-50 transition-colors duration-300 text-white"
          aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
            </svg>
          )}
        </button>
      </nav>

      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-[200px] opacity-100 mt-8" : "max-h-0 opacity-0",
        )}
      >
        <div className="container mx-auto px-6 pb-6">
          <a
            href="#calculator"
            onClick={scrollToCalculator}
            className="inline-flex items-center justify-center gap-2 text-sm px-5 py-2.5 bg-white text-foreground border border-foreground/20 hover:bg-foreground hover:text-white transition-all duration-300"
          >
            Контакты
          </a>
        </div>
      </div>
    </header>
  )
}