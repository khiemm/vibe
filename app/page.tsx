'use client'

import { motion } from 'framer-motion'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-2xl text-center space-y-6"
      >
        <h1 className="text-4xl md:text-5xl font-light tracking-tight">
          Hello, I'm here.
        </h1>
        <p className="text-lg text-gray-400 font-light">
          A calm space on the web.
        </p>
      </motion.div>
    </main>
  )
}
