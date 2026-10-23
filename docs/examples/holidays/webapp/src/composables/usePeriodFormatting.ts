import { type IPeriod } from 'periodz'

export function usePeriodFormatting() {
  function formatPeriod(period: IPeriod): string {
    const start = period.start as Date
    const end = period.end as Date
    
    const sameDay = start.toDateString() === end.toDateString()
    
    if (sameDay) {
      return `${start.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      })} ${start.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${end.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
    } else {
      return `${start.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })} ${start.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${end.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })} ${end.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
    }
  }

  return {
    formatPeriod
  }
}