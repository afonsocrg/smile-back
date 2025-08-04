import { useState, useEffect } from 'react'
import { useLocalStorage } from '@uidotdev/usehooks'
import { HelpCircle } from 'lucide-react'
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
} from '@/components/ui/dialog'

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
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-warm-700">
              SmileBack 😁
            </h1>
            <Dialog>
              <DialogTrigger asChild>
                <button className="p-2 rounded-full hover:bg-warm-100 transition-colors cursor-pointer">
                  <HelpCircle className="h-5 w-5 text-warm-600" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-warm-50 border-warm-200">
                <DialogHeader>
                  <DialogTitle className="text-warm-800 text-xl">How it works</DialogTitle>
                  <DialogDescription className="text-warm-700 text-left space-y-3 pt-2">
                    <div>
                      <strong className="text-warm-800">1. Smile at someone</strong> in real life - a stranger, friend, or colleague.
                    </div>
                    <div>
                      <strong className="text-warm-800">2. Record the interaction:</strong>
                      <ul className="mt-1 ml-4 space-y-1">
                        <li>• Tap "Person Smiled Back" if they returned your smile</li>
                        <li>• Tap "Person Didn't Smile Back" if they didn't respond</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-warm-800">3. Watch your impact grow!</strong> See how many new smiles you've brought to the world today.
                    </div>
                    <div className="pt-2 border-t border-warm-200">
                      <p className="text-sm text-warm-600">
                        Every smile you give creates positivity. When someone smiles back, you've created two new smiles! ✨
                      </p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
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

        {/* Encouragement */}
        {stats.totalSmiles === 0 && (
          <div className="text-center mt-8">
            <p className="text-neutral-500 text-sm">
              Start spreading smiles! Tap a button when you smile at someone.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

