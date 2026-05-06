import { useState } from "react"

type RoomType = "openspace" | "panoramic"

const openSpaceData = [
  { area: 15, price: 3605889 },
  { area: 17, price: 4086674 },
  { area: 50, price: 11720845 },
  { area: 80, price: 18353061 },
  { area: 99, price: 22468212 },
  { area: 112, price: 25145840 },
  { area: 200, price: 42088835 },
  { area: 400, price: 72900000 },
  { area: 500, price: 90000000 },
  { area: 600, price: 108000000 },
]

const panoramicData = [
  { area: 40, price: 13991640 },
  { area: 80, price: 27189720 },
  { area: 120, price: 39627997 },
  { area: 160, price: 51338951 },
  { area: 200, price: 62353829 },
  { area: 240, price: 72702693 },
  { area: 280, price: 84000000 },
  { area: 320, price: 96000000 },
]

function interpolatePrice(area: number, data: { area: number; price: number }[]): number | null {
  if (area <= 0) return null

  const sorted = [...data].sort((a, b) => a.area - b.area)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  if (area < min.area || area > max.area) return null

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (area >= a.area && area <= b.area) {
      const t = (area - a.area) / (b.area - a.area)
      return Math.round(a.price + t * (b.price - a.price))
    }
  }

  return null
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value)
}

export function Calculator() {
  const [roomType, setRoomType] = useState<RoomType>("openspace")
  const [area, setArea] = useState("")

  const data = roomType === "openspace" ? openSpaceData : panoramicData
  const minArea = data[0].area
  const maxArea = data[data.length - 1].area

  const areaNum = parseFloat(area)
  const price = area && !isNaN(areaNum) ? interpolatePrice(areaNum, data) : null
  const pricePerM2 = price && areaNum > 0 ? Math.round(price / areaNum) : null
  const outOfRange = area && !isNaN(areaNum) && (areaNum < minArea || areaNum > maxArea)

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6 md:px-12">
        <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">Стоимость</p>
        <h2 className="text-4xl md:text-5xl font-medium text-foreground mb-4 leading-tight">
          Калькулятор
          <br />
          <span className="text-accent">аренды помещения</span>
        </h2>
        <p className="text-muted-foreground mb-12 max-w-xl">
          Укажите тип и площадь помещения — мы рассчитаем стоимость на основе актуального прайса.
        </p>

        <div className="max-w-2xl">
          <div className="flex gap-2 mb-8 p-1 bg-muted rounded-sm w-fit">
            <button
              onClick={() => { setRoomType("openspace"); setArea("") }}
              className={`px-5 py-2.5 text-sm font-medium transition-all rounded-sm ${
                roomType === "openspace"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Open Space (2–3 этаж)
            </button>
            <button
              onClick={() => { setRoomType("panoramic"); setArea("") }}
              className={`px-5 py-2.5 text-sm font-medium transition-all rounded-sm ${
                roomType === "panoramic"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Панорамный вход
            </button>
          </div>

          <div className="mb-8">
            <label className="block text-sm tracking-widest uppercase text-muted-foreground mb-3">
              Площадь помещения (м²)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={minArea}
                max={maxArea}
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder={`от ${minArea} до ${maxArea}`}
                className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-foreground text-lg focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
              <span className="text-muted-foreground text-sm whitespace-nowrap">м²</span>
            </div>
            {outOfRange && (
              <p className="text-sm text-destructive mt-2">
                Введите площадь от {minArea} до {maxArea} м²
              </p>
            )}
          </div>

          {price && pricePerM2 && (
            <div className="border border-border rounded-sm p-8 bg-card">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Итого</p>
                  <p className="text-3xl font-medium text-foreground">{formatPrice(price)}</p>
                </div>
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Цена за м²</p>
                  <p className="text-3xl font-medium text-foreground">{formatPrice(pricePerM2)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-6">
                Расчёт является предварительным. Точная стоимость уточняется при заключении договора.
              </p>
            </div>
          )}

          {!price && !outOfRange && area && !isNaN(areaNum) && (
            <div className="border border-border rounded-sm p-8 bg-card">
              <p className="text-muted-foreground">Введите корректную площадь для расчёта.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
