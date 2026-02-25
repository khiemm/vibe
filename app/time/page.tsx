'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import cities from '@/content/cities.json';
import quotes from '@/content/quotes.json';

type City = (typeof cities)[number];

function formatTime(timezone: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function getDaysInYear(year: number): number {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
}

export default function TimePage() {
  const [now, setNow] = useState(new Date());
  const [times, setTimes] = useState<Record<string, string>>({});
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNow(d);
      const next: Record<string, string> = {};
      for (const city of cities) {
        next[city.timezone] = formatTime(city.timezone);
      }
      setTimes(next);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % quotes.length);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedCity) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCity(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCity]);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const secondDeg = (seconds / 60) * 360;
  const minuteDeg = (minutes / 60 + seconds / 3600) * 360;
  const hourDeg = ((hours % 12) / 12 + minutes / 720 + seconds / 43200) * 360;
  const dayProgress = ((hours * 3600 + minutes * 60 + seconds) / 86400) * 100;
  const dayOfYear = getDayOfYear(now);
  const daysInYear = getDaysInYear(now.getFullYear());

  const currentMoment = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-4xl w-full"
      >
        <h1 className="text-3xl font-light tracking-tight mb-12 text-center text-gray-100">
          Time
        </h1>

        <section className="flex flex-col items-center space-y-8 mb-16">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#525252"
                strokeWidth="1.5"
              />
              {Array.from({ length: 12 }, (_, i) => {
                const angle = ((i * 30 - 90) * Math.PI) / 180;
                const x1 = 50 + 40 * Math.cos(angle);
                const y1 = 50 + 40 * Math.sin(angle);
                const x2 = 50 + 45 * Math.cos(angle);
                const y2 = 50 + 45 * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#525252"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                );
              })}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="28"
                stroke="#d4d4d4"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${hourDeg} 50 50)`}
              />
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="18"
                stroke="#a3a3a3"
                strokeWidth="1.5"
                strokeLinecap="round"
                transform={`rotate(${minuteDeg} 50 50)`}
              />
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="12"
                stroke="#737373"
                strokeWidth="0.5"
                strokeLinecap="round"
                transform={`rotate(${secondDeg} 50 50)`}
              />
            </svg>
          </div>

          <p className="text-lg font-light text-gray-400 text-center">
            {currentMoment}
          </p>

          <div className="w-full max-w-xs space-y-2">
            <p className="text-sm font-light text-gray-500 text-center">
              {Math.round(dayProgress)}% through the day
            </p>
            <div className="h-1 bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-gray-500 transition-all duration-1000"
                style={{ width: `${dayProgress}%` }}
              />
            </div>
          </div>

          <p className="text-sm font-light text-gray-500 text-center">
            Day {dayOfYear} of {daysInYear}
          </p>

          <p className="text-base font-light text-gray-400 text-center italic max-w-md">
            "{quotes[quoteIndex]}"
          </p>
        </section>

        <section>
          <h2 className="text-xl font-light tracking-tight mb-8 text-center text-gray-100">
            World time
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {cities.map((city) => (
              <button
                key={city.timezone}
                type="button"
                onClick={() => setSelectedCity(city)}
                aria-label={`Open ${city.name} details`}
                className="relative overflow-hidden rounded-sm aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-500"
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
              </button>
            ))}
          </div>
        </section>

        {selectedCity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCity(null)}
          >
            <div className="absolute inset-0 bg-black/90" />
            <div
              className="relative w-full max-w-2xl aspect-[4/3] overflow-hidden rounded-sm bg-gradient-to-br from-gray-800 to-gray-900"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundImage: `url(${selectedCity.image}), linear-gradient(to bottom right, rgb(31 41 55), rgb(17 24 39))`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3
                  className="text-xl font-light text-white"
                  style={{
                    textShadow:
                      '0 1px 3px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)',
                  }}
                >
                  {selectedCity.name}
                </h3>
                <p
                  className="mt-2 text-sm font-light text-gray-200"
                  style={{
                    textShadow:
                      '0 1px 3px rgba(0,0,0,0.9), 0 0 15px rgba(0,0,0,0.5)',
                  }}
                >
                  {selectedCity.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
