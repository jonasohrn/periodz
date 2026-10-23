import { PeriodSeq, type PeriodLike } from 'periodz'
import type { Employee } from './useEmployees'

export function useCoverage() {
  function findCoverageGaps(employees: Employee[], timeRange: PeriodLike): PeriodLike {
    const totalCoverage = employees.reduce((acc, emp) => acc.union(emp.schedule), PeriodSeq([]) as PeriodLike)
    return timeRange.subtract(totalCoverage)
  }

  function getTeamCoverage(employees: Employee[]): PeriodLike {
    let teamCoverage: PeriodLike = PeriodSeq([])
    
    employees.forEach(employee => {
      teamCoverage = teamCoverage.union(employee.schedule)
    })
    
    return teamCoverage
  }

  function findFullTeamCoverage(employees: Employee[]): PeriodLike {
    if (employees.length === 0) {
      return PeriodSeq([])
    }
    
    const firstEmployee = employees[0]
    if (!firstEmployee) {
      return PeriodSeq([])
    }
    
    let intersection = firstEmployee.schedule
    employees.slice(1).forEach(employee => {
      intersection = intersection.intersection(employee.schedule)
    })
    
    return intersection
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