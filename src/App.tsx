import { useState, useEffect } from 'react'
import { useLocalStorage } from '@uidotdev/usehooks'
import { STORAGE_KEYS } from './constants/storage'
import type { SmileEntry, DailyStats } from './types/smile'
import { posthog } from './lib/posthog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function App() {
  const [entries, setEntries] = useLocalStorage<SmileEntry[]>(STORAGE_KEYS.SMILE_ENTRIES, [])
  const [stats, setStats] = useState<DailyStats>({
    totalSmiles: 0,
    smilesBack: 0,
    totalNewSmiles: 0,
  })

  // Initialize stats from localStorage on mount only
  useEffect(() => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1
    
    const todaysEntries = entries.filter(entry => entry.timestamp >= startOfDay && entry.timestamp <= endOfDay)
    const totalSmiles = todaysEntries.length
    const smilesBack = todaysEntries.filter(entry => entry.smileBack).length
    const totalNewSmiles = totalSmiles + smilesBack

    setStats({ totalSmiles, smilesBack, totalNewSmiles })
  }, []) // Empty dependency array - only run on mount

  const handleSmileBack = () => {
    // Track analytics event
    posthog.capture('smile_back_reported', {
      timestamp: Date.now(),
      daily_total_smiles: stats.totalSmiles + 1,
      daily_smiles_back: stats.smilesBack + 1,
    })

    // Update stats immediately for instant UI feedback
    setStats(prev => ({
      totalSmiles: prev.totalSmiles + 1,
      smilesBack: prev.smilesBack + 1,
      totalNewSmiles: prev.totalNewSmiles + 2, // +1 for smile given, +1 for smile received
    }))

    // Save to localStorage in background
    const newEntry: SmileEntry = { smileBack: true, timestamp: Date.now() }
    setEntries(prev => [...prev, newEntry])
  }

  const handleNoSmileBack = () => {
    // Track analytics event
    posthog.capture('no_smile_back_reported', {
      timestamp: Date.now(),
      daily_total_smiles: stats.totalSmiles + 1,
      daily_smiles_back: stats.smilesBack,
    })

    // Update stats immediately for instant UI feedback
    setStats(prev => ({
      totalSmiles: prev.totalSmiles + 1,
      smilesBack: prev.smilesBack,
      totalNewSmiles: prev.totalNewSmiles + 1, // +1 for smile given only
    }))

    // Save to localStorage in background
    const newEntry: SmileEntry = { smileBack: false, timestamp: Date.now() }
    setEntries(prev => [...prev, newEntry])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-warm-100 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-warm-700 mb-2">
            SmileBack 😁
          </h1>
          <p className="text-neutral-600 text-sm">
            Spread joy, one smile at a time
          </p>
        </div>

        {/* Statistics */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 mb-8 shadow-lg">
          <div className="text-center space-y-4">
            {/* Primary Stat */}
            <div>
              <p className="text-2xl font-bold text-neutral-800 mb-1">
                You smiled at{' '}
                <span className="text-warm-600">{stats.totalSmiles}</span>{' '}
                {stats.totalSmiles === 1 ? 'person' : 'people'} today
              </p>
            </div>

            {/* Secondary Stat */}
            {stats.smilesBack > 0 && (
              <div>
                <p className="text-lg text-smile-700 font-medium">
                  <span className="text-smile-600">{stats.smilesBack}</span>{' '}
                  {stats.smilesBack === 1 ? 'person smiled' : 'people smiled'} back
                </p>
              </div>
            )}

            {/* Final Message */}
            {stats.totalNewSmiles > 0 && (
              <div className="pt-2 border-t border-warm-200">
                <p className="text-lg font-semibold text-warm-800">
                  You brought{' '}
                  <span className="text-warm-600">{stats.totalNewSmiles}</span>{' '}
                  new {stats.totalNewSmiles === 1 ? 'smile' : 'smiles'}<br/>to this world today! ✨
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleSmileBack}
            className="w-full bg-smile-500 hover:bg-smile-600 active:bg-smile-700 text-white font-semibold py-6 px-8 rounded-2xl text-xl shadow-lg transition-all duration-150 transform active:scale-95 cursor-pointer"
          >
            <span className="text-2xl mr-3">😁</span>
            Person Smiled Back
          </button>

          <button
            onClick={handleNoSmileBack}
            className="w-full bg-neutral-400 hover:bg-neutral-500 active:bg-neutral-600 text-white font-semibold py-6 px-8 rounded-2xl text-xl shadow-lg transition-all duration-150 transform active:scale-95 cursor-pointer"
          >
            <span className="text-2xl mr-3">😔</span>
            Person Didn't Smile Back
          </button>
        </div>

        {/* How it works - Discrete text */}
        <div className="text-center mt-6">
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-neutral-500 text-sm underline hover:text-neutral-600 transition-colors">
                How it works
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>How to Use SmileBack</DialogTitle>
              </DialogHeader>
              <div className="text-left space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <span className="text-warm-600 font-semibold">1.</span>
                  <span>If you make eye contact with someone, give them the kindest and purest smile you have</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-smile-600 font-semibold">2.</span>
                  <span>If the person smiles back, click on the green button</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neutral-600 font-semibold">3.</span>
                  <span>If the person doesn't smile back, click on the gray one</span>
                </div>
                <div className="pt-4 border-t border-neutral-200">
                  <div className="text-warm-700 font-medium">
                    No matter the outcome, whenever you smile at others, you make this world a better place. If they smile back, it's a bonus!
                  </div>
                  <div className="mt-2 text-neutral-600">
                    Have a wholesome day! ✨
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Encouragement */}
        {stats.totalSmiles === 0 && (
          <div className="text-center mt-4">
            <p className="text-neutral-500 text-sm">
              Start spreading smiles! Tap a button when you smile at someone.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

