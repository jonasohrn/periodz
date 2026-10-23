import { computed } from 'vue'
import { Period, PeriodSeq, type PeriodLike } from 'periodz'
import { useHolidays, type EmployeeHoliday } from './useHolidays'

export interface WorkPeriodWithDates {
  period: PeriodLike
  startDate: Date
  endDate: Date
  dayName: string
}

export interface Employee {
  name: string
  role: string
  schedule: PeriodLike
  workPeriods: WorkPeriodWithDates[]
}

function createEmployeeWorkWeek(
  employeeName: string,
  workDays: string[],
  startHour: number,
  endHour: number,
  weekOf: Date = new Date('2024-12-23')
): { schedule: PeriodLike; workPeriods: WorkPeriodWithDates[] } {
  const workPeriods: PeriodLike[] = []
  const workPeriodsWithDates: WorkPeriodWithDates[] = []
  
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDate = new Date(weekOf)
    currentDate.setDate(currentDate.getDate() + dayOffset)
    
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' })
    
    if (workDays.includes(dayName)) {
      const startTime = new Date(currentDate)
      startTime.setHours(startHour, 0, 0, 0)
      
      const endTime = new Date(currentDate)
      endTime.setHours(endHour, 0, 0, 0)
      
      const workPeriod = Period(startTime, endTime, employeeName)
      if (!workPeriod.isEmpty()) {
        workPeriods.push(workPeriod)
        workPeriodsWithDates.push({
          period: workPeriod,
          startDate: startTime,
          endDate: endTime,
          dayName: dayName
        })
      }
    }
  }
  
  return {
    schedule: PeriodSeq(workPeriods),
    workPeriods: workPeriodsWithDates
  }
}

function applyEmployeeHolidays(
  employeeName: string,
  role: string, 
  baseWorkData: { schedule: PeriodLike; workPeriods: WorkPeriodWithDates[] },
  holidays: EmployeeHoliday[]
): Employee {
  let updatedSchedule = baseWorkData.schedule
  const updatedWorkPeriods = [...baseWorkData.workPeriods]
  
  const employeeHolidays = holidays.filter(holiday => holiday.employee === employeeName)
  
  employeeHolidays.forEach(holiday => {
    const holidayDate = new Date(holiday.date)
    
    let holidayPeriod: PeriodLike
    
    if (!holiday.startTime && !holiday.endTime) {
      const startOfDay = new Date(holidayDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(holidayDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      holidayPeriod = Period(startOfDay, endOfDay, `${employeeName} - ${holiday.reason}`)
    } else if (holiday.startTime && !holiday.endTime) {
      const timeParts = holiday.startTime.split(':')
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0] ?? '0')
        const minutes = parseInt(timeParts[1] ?? '0')
        const startTime = new Date(holidayDate)
        startTime.setHours(hours, minutes, 0, 0)
        const endOfDay = new Date(holidayDate)
        endOfDay.setHours(23, 59, 59, 999)
        
        holidayPeriod = Period(startTime, endOfDay, `${employeeName} - ${holiday.reason}`)
      } else {
        console.warn(`Invalid startTime format for ${employeeName}: ${holiday.startTime}`)
        return
      }
    } else if (!holiday.startTime && holiday.endTime) {
      const timeParts = holiday.endTime.split(':')
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0] ?? '0')
        const minutes = parseInt(timeParts[1] ?? '0')
        const startOfDay = new Date(holidayDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endTime = new Date(holidayDate)
        endTime.setHours(hours, minutes, 0, 0)
        
        holidayPeriod = Period(startOfDay, endTime, `${employeeName} - ${holiday.reason}`)
      } else {
        console.warn(`Invalid endTime format for ${employeeName}: ${holiday.endTime}`)
        return
      }
    } else if (holiday.startTime && holiday.endTime) {
      const startTimeParts = holiday.startTime.split(':')
      const endTimeParts = holiday.endTime.split(':')
      
      if (startTimeParts.length >= 2 && endTimeParts.length >= 2) {
        const startHours = parseInt(startTimeParts[0] ?? '0')
        const startMinutes = parseInt(startTimeParts[1] ?? '0')
        const endHours = parseInt(endTimeParts[0] ?? '0')
        const endMinutes = parseInt(endTimeParts[1] ?? '0')
        
        const startTime = new Date(holidayDate)
        startTime.setHours(startHours, startMinutes, 0, 0)
        const endTime = new Date(holidayDate)
        endTime.setHours(endHours, endMinutes, 0, 0)
        
        holidayPeriod = Period(startTime, endTime, `${employeeName} - ${holiday.reason}`)
      } else {
        console.warn(`Invalid time format for ${employeeName}: ${holiday.startTime} - ${holiday.endTime}`)
        return
      }
    } else {
      console.warn(`Invalid holiday configuration for ${employeeName}`)
      return
    }
    
    updatedSchedule = updatedSchedule.subtract(holidayPeriod)
  })
  
  return {
    name: employeeName,
    role: role,
    schedule: updatedSchedule,
    workPeriods: updatedWorkPeriods
  }
}

export function useEmployees() {
  const { holidays } = useHolidays()
  
  const employees = computed(() => {
    const alice = applyEmployeeHolidays(
      'Alice Chen',
      'Senior Software Engineer',
      createEmployeeWorkWeek('Alice Chen', 
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 9, 17),
      holidays.value
    )

    const bob = applyEmployeeHolidays(
      'Bob Martinez',
      'UI/UX Designer',
      createEmployeeWorkWeek('Bob Martinez',
        ['Tuesday', 'Wednesday', 'Thursday'], 10, 16),
      holidays.value
    )

    const carol = applyEmployeeHolidays(
      'Carol Johnson',
      'Project Manager',
      createEmployeeWorkWeek('Carol Johnson',
        ['Monday', 'Wednesday', 'Friday'], 8, 18),
      holidays.value
    )

    return [alice, bob, carol]
  })

  const workWeek = computed(() => {
    return PeriodSeq([
      Period(new Date('2024-12-23T08:00:00'), new Date('2024-12-23T18:00:00')),
      Period(new Date('2024-12-24T08:00:00'), new Date('2024-12-24T18:00:00')),
      Period(new Date('2024-12-25T08:00:00'), new Date('2024-12-25T18:00:00')),
      Period(new Date('2024-12-26T08:00:00'), new Date('2024-12-26T18:00:00')),
      Period(new Date('2024-12-27T08:00:00'), new Date('2024-12-27T18:00:00'))
    ])
  })

  return {
    employees,
    workWeek
  }
}