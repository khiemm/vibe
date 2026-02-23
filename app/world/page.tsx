'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import cities from '@/content/cities.json'

function formatTime(timezone: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date())
}

export default function WorldPage() {
  const [times, setTimes] = useState<Record<string, string>>({})

  useEffect(() => {
    const update = () => {
      const next: Record<string, string> = {}
      for (const city of cities) {
        next[city.timezone] = formatTime(city.timezone)
      }
      setTimes(next)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-4xl w-full"
      >
        <h1 className="text-3xl font-light tracking-tight mb-12 text-center text-gray-100">
          World time
        </h1>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <div
              key={city.timezone}
              className="relative overflow-hidden rounded-lg aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900"
              style={{
                backgroundImage: `url(${city.image}), linear-gradient(to bottom right, rgb(31 41 55), rgb(17 24 39))`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                <span className="text-2xl font-light tracking-tight text-white">
                  {city.name}
                </span>
                <span className="text-lg font-light text-gray-200 mt-2">
                  {times[city.timezone] ?? '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </main>
  )
}
