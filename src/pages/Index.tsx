import { Header } from "../components/Header"
import { Hero } from "../components/Hero"
import { Calculator } from "../components/Calculator"
import { Footer } from "../components/Footer"

export default function Index() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Calculator />
      <Footer />
    </main>
  )
}
