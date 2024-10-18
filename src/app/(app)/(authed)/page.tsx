'use client'

import { startEntry, appendMyselfToEntry } from '@/lib/actions'
import type { ResolvedEntryDocument } from '@/types/entry'
import { Button } from '@/components/ui/button'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { SubmitDialog } from '@/components/submit-dialog'
import { Timer } from '@/components/timer'
import { AllTrips } from '@/components/all-trips'
import { PlusIcon, HandshakeIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Header } from '@/components/header'
import Link from 'next/link'
import { toast } from 'sonner'
import { useEntrySubscription } from '@/hooks/useEntrySubscription'
import { useIsPwa } from '@/hooks/useIsPwa'
import { cn, firstName, humanJoin } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { QuickStats } from '@/components/quick-stats'

const motionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export default function Home() {
  const { activeEntry, setActiveEntry, allEntries, isLoading } =
    useEntrySubscription()
  const [editingEntry, setEditingEntry] =
    useState<ResolvedEntryDocument | null>(null)
  const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false)
  const session = useSession()
  const isPwa = useIsPwa()

  const sessionUserIsWalking = useMemo(() => {
    return activeEntry?.users?.some(
      (user) => user.email === session.data?.user?.email
    )
  }, [activeEntry, session])

  const canJoin = useMemo(() => {
    return !sessionUserIsWalking && !!activeEntry
  }, [sessionUserIsWalking, activeEntry])

  const handleAddManually = useCallback(() => {
    setShowSubmitDialog(true)
    setEditingEntry(null)
  }, [])
  const handleStopEntry = useCallback(() => {
    setShowSubmitDialog(true)
    setEditingEntry(null)
  }, [])
  const handleEditEntry = useCallback((entry: ResolvedEntryDocument) => {
    setShowSubmitDialog(true)
    setEditingEntry(entry)
  }, [])
  const handleOnCloseSubmitDialog = useCallback(() => {
    setShowSubmitDialog(false)
    setEditingEntry(null)
  }, [])
  const handleOnSubmit = useCallback(() => {
    setShowSubmitDialog(false)
    setActiveEntry(null)
    setEditingEntry(null)
  }, [setActiveEntry])

  const handleAppendMyselfToEntry = useCallback(() => {
    if (!activeEntry) return
    appendMyselfToEntry(activeEntry._id)
    toast("You're added to the walk 💚", {
      id: 'append-walker',
      description: 'Have fun outside!',
    })
  }, [activeEntry])

  useEffect(() => {
    const visibilityChangeHandler = async () => {
      if (document.visibilityState !== 'visible') return

      const walkerNames = activeEntry?.users?.map((w) => firstName(w.name))

      const activeTripMessage = sessionUserIsWalking
        ? 'Hope you had a nice walk! 🐕‍🦺'
        : `${humanJoin(walkerNames)} is on a walk! 🤩`

      const id = 'welcome-back'
      const message = activeEntry
        ? activeTripMessage
        : 'Ready for a new walk? Welcome back! 👋'
      const description = activeEntry
        ? 'Tap finish to end the walk'
        : 'Tap start to begin a new walk'
      const action = canJoin && {
        label: 'Join!',
        onClick: handleAppendMyselfToEntry,
      }

      toast(message, { id, description, action })
    }

    window.addEventListener('visibilitychange', visibilityChangeHandler)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('visibilitychange', visibilityChangeHandler)
      document.body.style.overflow = 'auto'
    }
  }, [activeEntry, sessionUserIsWalking, canJoin, handleAppendMyselfToEntry])

  const handleStartEntry = useCallback(async () => {
    const startTime = new Date().toISOString()
    const tempEntry: ResolvedEntryDocument = {
      _id: 'temp',
      _type: 'entry',
      startTime,
      status: 'active',
      mode: 'auto',
      location: 'outside',
      users: session.data?.user ? [{ ...session.data.user }] : [],
    }
    setActiveEntry(tempEntry)

    try {
      const newEntry = await startEntry(startTime)
      setActiveEntry(newEntry as ResolvedEntryDocument)
    } catch (error) {
      console.error('Error starting entry:', error)
      setActiveEntry(null)
    }
  }, [setActiveEntry, session])

  return (
    <>
      <div className="text-center grid grid-rows-[auto,1fr,auto] h-[100dvh] p-4">
        <Header>
          <Button variant="outline" size="sm" asChild>
            <Link href="/stats">Stats</Link>
          </Button>

          {!activeEntry && (
            <Button
              size="icon"
              title="Add manually"
              variant="secondary"
              onClick={handleAddManually}
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
          )}
        </Header>

        <motion.main
          className="overflow-auto fade grid items-center mt-1 mb-3 before:h-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoading ? 0 : 1 }}
        >
          <AnimatePresence mode="wait">
            {activeEntry ? (
              <motion.div key="timer" {...motionProps}>
                <Timer entry={activeEntry} />
              </motion.div>
            ) : (
              <motion.div key="lastTrip" {...motionProps}>
                <QuickStats entries={allEntries} />
                <AllTrips entries={allEntries} onEdit={handleEditEntry} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.main>

        <footer
          className={cn('flex flex-col gap-3', {
            'pb-6': isPwa,
          })}
        >
          {activeEntry ? (
            <>
              <p className="text-sm text-muted-foreground font-medium">
                Ani on a walk, never grumpy
              </p>

              <div className="flex gap-2">
                <Button
                  size="lg"
                  className="w-full"
                  variant="destructive"
                  onClick={handleStopEntry}
                >
                  Finish the walk
                </Button>
                {canJoin && (
                  <Button
                    size="lg"
                    className="w-full"
                    variant="outline"
                    onClick={handleAppendMyselfToEntry}
                  >
                    Join
                    <HandshakeIcon className="size-6 ml-2.5" />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground font-medium">
                Are you and Ani ready for a walk?
              </p>
              <Button
                size="lg"
                className="w-full"
                variant="positive"
                onClick={handleStartEntry}
                type="button"
              >
                Start a new walk
              </Button>
            </>
          )}
        </footer>
      </div>

      <SubmitDialog
        entry={editingEntry || activeEntry}
        open={showSubmitDialog}
        onClose={handleOnCloseSubmitDialog}
        onSubmit={handleOnSubmit}
      />
    </>
  )
}
