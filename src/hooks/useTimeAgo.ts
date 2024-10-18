import { pluralize } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function useTimeAgo(date: string | number | Date): string {
  const [timeAgo, setTimeAgo] = useState<string>('')

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date()
      const past = new Date(date)
      const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

      switch (true) {
        case diffInSeconds < 60:
          setTimeAgo('Now')
          break
        case diffInSeconds < 3600: {
          const minutes = Math.floor(diffInSeconds / 60)
          setTimeAgo(`${minutes} min ago`)
          break
        }
        case diffInSeconds < 3600 * 3: {
          const minutes = Math.floor(diffInSeconds / 60) % 60
          const hours = Math.floor(diffInSeconds / 3600)
          setTimeAgo(
            `${hours} ${pluralize(hours, 'hour', 'hours')} & ${minutes} min ago`
          )
          break
        }
        case diffInSeconds < 86400: {
          const hours = Math.floor(diffInSeconds / 3600)
          setTimeAgo(`${hours} ${pluralize(hours, 'hour', 'hours')} ago`)
          break
        }
        case diffInSeconds < 172800: {
          setTimeAgo('Yesterday')
          break
        }
        case diffInSeconds < 2592000: {
          const days = Math.floor(diffInSeconds / 86400)
          setTimeAgo(`${days} days ago`)
          break
        }
        case diffInSeconds < 31536000: {
          const months = Math.floor(diffInSeconds / 2592000)
          setTimeAgo(`${months} months ago`)
          break
        }
        default: {
          const years = Math.floor(diffInSeconds / 31536000)
          setTimeAgo(`${years} year ago`)
        }
      }
    }

    updateTimeAgo()
    const intervalId = setInterval(updateTimeAgo, 60000)

    return () => clearInterval(intervalId)
  }, [date])

  return timeAgo
}
