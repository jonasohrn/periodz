import { intersection, union, type PeriodLike } from 'periodz'
import type { Employee } from './useEmployees'

export function useCoverage() {
  function findCoverageGaps(employees: Employee[], timeRange: PeriodLike): PeriodLike {
    const totalCoverage = union(employees.map(employee => employee.schedule))
    return timeRange.subtract(totalCoverage)
  }

  function getTeamCoverage(employees: Employee[]): PeriodLike {
    return union(employees.map(employee => employee.schedule))
  }

  function findFullTeamCoverage(employees: Employee[]): PeriodLike {
    return intersection(employees.map(employee => employee.schedule))
  }

  function findMinimalCoverage(employees: Employee[]): PeriodLike {
    const teamCoverage = getTeamCoverage(employees)
    let minimalPeriods = teamCoverage
    
    employees.forEach((emp1, i) => {
      employees.slice(i + 1).forEach(emp2 => {
        const overlap = emp1.schedule.intersection(emp2.schedule)
        minimalPeriods = minimalPeriods.subtract(overlap)
      })
    })
    
    return minimalPeriods
  }

  return {
    findCoverageGaps,
    getTeamCoverage,
    findFullTeamCoverage,
    findMinimalCoverage
  }
}