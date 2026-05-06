import { Header } from "../components/Header"
import { Calculator } from "../components/Calculator"

export default function Index() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 md:px-12 pt-36 pb-4">
        <h1 className="text-4xl md:text-6xl font-medium text-foreground leading-tight">
          Калькулятор недвижимости.
          <br />
          <span className="text-accent">Техническая 120Б</span>
        </h1>
      </div>
      <Calculator />
      <section id="contacts" className="py-16 border-t border-border">
        <div className="container mx-auto px-6 md:px-12">
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-8">Контакты</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="tel:+79872971733"
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity"
            >
              +7 987 297 17 33
            </a>
            <a
              href="https://t.me/mrsfedosova"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-border text-foreground px-8 py-4 rounded-sm text-sm font-medium hover:bg-muted transition-colors"
            >
              @mrsfedosova в Telegram
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
