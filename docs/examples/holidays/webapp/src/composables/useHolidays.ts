import { ref } from 'vue'

export interface EmployeeHoliday {
  employee: string
  date: string
  startTime?: string
  endTime?: string
  reason: string
}

export function useHolidays() {
  const holidays = ref<EmployeeHoliday[]>([
    // Alice Chen holidays
    { employee: 'Alice Chen', date: '2024-12-24', startTime: '13:00', reason: 'Christmas Eve Early Leave' },
    { employee: 'Alice Chen', date: '2024-12-30', reason: 'Personal Day' },
    { employee: 'Alice Chen', date: '2025-01-02', endTime: '11:00', reason: 'New Year Recovery' },
    
    // Bob Martinez holidays  
    { employee: 'Bob Martinez', date: '2024-12-26', reason: 'Boxing Day' },
    { employee: 'Bob Martinez', date: '2024-12-31', startTime: '12:00', reason: 'New Year\'s Eve Early Leave' },
    
    // Carol Johnson holidays
    { employee: 'Carol Johnson', date: '2024-12-23', startTime: '14:00', reason: 'Christmas Prep' },
    { employee: 'Carol Johnson', date: '2024-12-27', reason: 'Family Time' },
    { employee: 'Carol Johnson', date: '2025-01-01', reason: 'New Year\'s Day' }
  ])

  return {
    holidays
  }
}