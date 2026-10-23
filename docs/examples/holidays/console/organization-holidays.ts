/* eslint-disable no-console */
/**
 * Organization Holiday Management Example
 * 
 * This example demonstrates how to use the periodz library to manage
 * an organization's holiday situation with 3 employees and their work periods.
 * 
 * Scenario: TechCorp Solutions during Christmas/New Year break 2024-2025
 */

import { type IPeriod } from '../../../../src/types.ts';
import { Period, PeriodSeq, isPeriod, type PeriodLike } from '../../../../src/index.ts';

// ===== EMPLOYEE DEFINITIONS =====

interface WorkPeriodWithDates {
  period: PeriodLike;
  startDate: Date;
  endDate: Date;
  dayName: string;
}

interface Employee {
  name: string;
  role: string;
  schedule: PeriodLike;
  workPeriods: WorkPeriodWithDates[]; // For display purposes
}

/**
 * Create a work week for an employee with specific days and hours
 */
function createEmployeeWorkWeek(
  employeeName: string,
  workDays: string[],
  startHour: number,
  endHour: number,
  weekOf: Date = new Date('2024-12-23') // Week of Christmas
): { schedule: PeriodLike; workPeriods: WorkPeriodWithDates[] } {
  const workPeriods: PeriodLike[] = [];
  const workPeriodsWithDates: WorkPeriodWithDates[] = [];
  
  // Create work periods for the specified week
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDate = new Date(weekOf);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (workDays.includes(dayName)) {
      const startTime = new Date(currentDate);
      startTime.setHours(startHour, 0, 0, 0);
      
      const endTime = new Date(currentDate);
      endTime.setHours(endHour, 0, 0, 0);
      
      // Create period with employee name as subject
      const workPeriod = Period(startTime, endTime, employeeName);
      if (!workPeriod.isEmpty()) {
        workPeriods.push(workPeriod);
        workPeriodsWithDates.push({
          period: workPeriod,
          startDate: startTime,
          endDate: endTime,
          dayName: dayName
        });
      }
    }
  }
  
  return {
    schedule: PeriodSeq(workPeriods),
    workPeriods: workPeriodsWithDates
  };
}

// ===== EMPLOYEE SETUP =====

console.log('🏢 TechCorp Solutions - Holiday Schedule Analysis');
console.log('================================================\n');

// Employee definitions are created below after applying individual holidays

// ===== INDIVIDUAL EMPLOYEE HOLIDAYS =====

interface EmployeeHoliday {
  employee: string;
  date: string;
  startTime?: string; // If not provided, it's a full day off
  endTime?: string;   // If not provided, it's a full day off
  reason: string;
}

// Define irregular holiday periods for each employee during Christmas break
const individualHolidays: EmployeeHoliday[] = [
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
];

/**
 * Apply individual holiday periods to an employee's schedule
 */
function applyEmployeeHolidays(
  employeeName: string,
  role: string, 
  baseWorkData: { schedule: PeriodLike; workPeriods: WorkPeriodWithDates[] },
  holidays: EmployeeHoliday[]
): Employee {
  let updatedSchedule = baseWorkData.schedule;
  const updatedWorkPeriods = [...baseWorkData.workPeriods];
  
  // Find holidays for this specific employee
  const employeeHolidays = holidays.filter(holiday => holiday.employee === employeeName);
  
  employeeHolidays.forEach(holiday => {
    const holidayDate = new Date(holiday.date);
    
    let holidayPeriod: PeriodLike;
    
    if (!holiday.startTime && !holiday.endTime) {
      // Full day off
      const startOfDay = new Date(holidayDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(holidayDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      holidayPeriod = Period(startOfDay, endOfDay, `${employeeName} - ${holiday.reason}`);
    } else if (holiday.startTime && !holiday.endTime) {
      // Off from startTime until end of day
      const timeParts = holiday.startTime.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0] ?? '0');
        const minutes = parseInt(timeParts[1] ?? '0');
        const startTime = new Date(holidayDate);
        startTime.setHours(hours, minutes, 0, 0);
        const endOfDay = new Date(holidayDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        holidayPeriod = Period(startTime, endOfDay, `${employeeName} - ${holiday.reason}`);
      } else {
        // Invalid time format, skip this holiday
        console.warn(`Invalid startTime format for ${employeeName}: ${holiday.startTime}`);
        return;
      }
    } else if (!holiday.startTime && holiday.endTime) {
      // Off from start of day until endTime
      const timeParts = holiday.endTime.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0] ?? '0');
        const minutes = parseInt(timeParts[1] ?? '0');
        const startOfDay = new Date(holidayDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endTime = new Date(holidayDate);
        endTime.setHours(hours, minutes, 0, 0);
        
        holidayPeriod = Period(startOfDay, endTime, `${employeeName} - ${holiday.reason}`);
      } else {
        // Invalid time format, skip this holiday
        console.warn(`Invalid endTime format for ${employeeName}: ${holiday.endTime}`);
        return;
      }
    } else if (holiday.startTime && holiday.endTime) {
      // Off between startTime and endTime
      const startTimeParts = holiday.startTime.split(':');
      const endTimeParts = holiday.endTime.split(':');
      
      if (startTimeParts.length >= 2 && endTimeParts.length >= 2) {
        const startHours = parseInt(startTimeParts[0] ?? '0');
        const startMinutes = parseInt(startTimeParts[1] ?? '0');
        const endHours = parseInt(endTimeParts[0] ?? '0');
        const endMinutes = parseInt(endTimeParts[1] ?? '0');
        
        const startTime = new Date(holidayDate);
        startTime.setHours(startHours, startMinutes, 0, 0);
        const endTime = new Date(holidayDate);
        endTime.setHours(endHours, endMinutes, 0, 0);
        
        holidayPeriod = Period(startTime, endTime, `${employeeName} - ${holiday.reason}`);
      } else {
        // Invalid time format, skip this holiday
        console.warn(`Invalid time format for ${employeeName}: ${holiday.startTime} - ${holiday.endTime}`);
        return;
      }
    } else {
      // This shouldn't happen, but handle gracefully
      console.warn(`Invalid holiday configuration for ${employeeName}`);
      return;
    }
    
    // Subtract the holiday period from the employee's schedule
    updatedSchedule = updatedSchedule.subtract(holidayPeriod);
  });
  
  return {
    name: employeeName,
    role: role,
    schedule: updatedSchedule,
    workPeriods: updatedWorkPeriods
  };
}

// Apply individual holidays to each employee
const alice = applyEmployeeHolidays(
  'Alice Chen',
  'Senior Software Engineer',
  createEmployeeWorkWeek('Alice Chen', 
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 9, 17),
  individualHolidays
);

const bob = applyEmployeeHolidays(
  'Bob Martinez',
  'UI/UX Designer',
  createEmployeeWorkWeek('Bob Martinez',
    ['Tuesday', 'Wednesday', 'Thursday'], 10, 16),
  individualHolidays
);

const carol = applyEmployeeHolidays(
  'Carol Johnson',
  'Project Manager',
  createEmployeeWorkWeek('Carol Johnson',
    ['Monday', 'Wednesday', 'Friday'], 8, 18),
  individualHolidays
);

const employees = [alice, bob, carol];

console.log('👥 Employee Work Schedules (with individual holidays applied):');
employees.forEach(emp => {
  console.log(`\n${emp.name} (${emp.role}):`);
  if (!emp.schedule.isEmpty()) {
    emp.schedule.periods().forEach(period => {
      if (isPeriod(period)) {
        console.log(`  ${formatPeriodForDisplay(period)}`);
      }
    });
  }
});

// ===== HOLIDAY PERIOD DEFINITION =====

console.log('\n\n🎄 Holiday Period Definition:');
console.log('===============================');

// Christmas/New Year break: December 23, 2024 - January 2, 2025
const christmasBreak = Period(
  new Date('2024-12-23T00:00:00'),
  new Date('2025-01-02T23:59:59'),
  'Christmas Break'
);

if (isPeriod(christmasBreak)) {
  console.log(`Company Holiday: ${formatPeriodForDisplay(christmasBreak)}`);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format a period for human-readable display
 */
function formatPeriodForDisplay(period: IPeriod): string {
  const start = period.start as Date;
  const end = period.end as Date;
  
  const sameDay = start.toDateString() === end.toDateString();
  
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
    })}`;
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
    })}`;
  }
}


/**
 * Find who works at a specific timestamp
 */
function whoWorksAt(timestamp: Date, employees: Employee[]): string[] {
  const workersAtTime: string[] = [];
  
  employees.forEach(employee => {
    if (employee.schedule.existsAt(timestamp)) {
      workersAtTime.push(employee.name);
    }
  });
  
  return workersAtTime;
}

/**
 * Find periods when nobody works (coverage gaps)
 */
function findCoverageGaps(employees: Employee[], timeRange: PeriodLike): PeriodLike {
  // Get all work periods from all employees
  const totalCoverage = employees.reduce((acc, emp) => acc.union(emp.schedule), PeriodSeq([]) as PeriodLike);

  // Subtract total coverage from the time range to find gaps
  return timeRange.subtract(totalCoverage);
}

/**
 * Calculate total team coverage (union of all schedules)
 */
function getTeamCoverage(employees: Employee[]): PeriodLike {
  let teamCoverage: PeriodLike = PeriodSeq([]);
  
  employees.forEach(employee => {
    teamCoverage = teamCoverage.union(employee.schedule);
  });
  
  return teamCoverage;
}

/**
 * Find periods when all employees work simultaneously
 */
function findFullTeamCoverage(employees: Employee[]): PeriodLike {
  if (employees.length === 0) {
    return PeriodSeq([]);
  }
  
  const firstEmployee = employees[0];
  if (!firstEmployee) {
    return PeriodSeq([]);
  }
  
  let intersection = firstEmployee.schedule;
  employees.slice(1).forEach(employee => {
    intersection = intersection.intersection(employee.schedule);
  });
  
  return intersection;
}

/**
 * Find periods with minimal coverage (only one person working)
 */
function findMinimalCoverage(employees: Employee[]): PeriodLike {
  const teamCoverage = getTeamCoverage(employees);
  let minimalPeriods = teamCoverage;
  
  // For each pair of employees, subtract their intersection from total coverage
  employees.forEach((emp1, i) => {
    employees.slice(i + 1).forEach(emp2 => {
      const overlap = emp1.schedule.intersection(emp2.schedule);
      minimalPeriods = minimalPeriods.subtract(overlap);
    });
  });
  
  return minimalPeriods;
}

// ===== PRACTICAL QUERIES =====

console.log('\n\n🔍 Practical Business Queries:');
console.log('===============================');

// Query 1: Who works on December 27th at 2 PM?
const dec27At2PM = new Date('2024-12-27T14:00:00');
const workersOnDec27 = whoWorksAt(dec27At2PM, employees);
console.log(`\n1. Who works on December 27th at 2:00 PM?`);
console.log(`   Workers: ${workersOnDec27.length > 0 ? workersOnDec27.join(', ') : 'Nobody'}`);

// Query 2: Coverage during the work week
const workWeek = PeriodSeq([
  Period(new Date('2024-12-23T08:00:00'), new Date('2024-12-23T18:00:00')),
  Period(new Date('2024-12-24T08:00:00'), new Date('2024-12-24T18:00:00')),
  Period(new Date('2024-12-25T08:00:00'), new Date('2024-12-25T18:00:00')),
  Period(new Date('2024-12-26T08:00:00'), new Date('2024-12-26T18:00:00')),
  Period(new Date('2024-12-27T08:00:00'), new Date('2024-12-27T18:00:00'))
]);

const coverageGaps = findCoverageGaps(employees, workWeek);
console.log(`\n2. Coverage Gaps Analysis:`);
if (coverageGaps.isEmpty()) {
  console.log('   ✅ No coverage gaps - someone is always working!');
} else {
  console.log('   ⚠️  Coverage gaps found:');
  coverageGaps.periods().forEach(gap => {
    if (isPeriod(gap)) {
      console.log(`     ${formatPeriodForDisplay(gap)}`);
    }
  });
}

// Query 3: When do all team members work simultaneously?
const fullTeamTimes = findFullTeamCoverage(employees);
console.log(`\n3. Full Team Coverage (all 3 employees working):`);
if (fullTeamTimes.isEmpty()) {
  console.log('   ❌ No times when all team members work simultaneously');
} else {
  console.log('   👥 All team members work together during:');
  fullTeamTimes.periods().forEach(period => {
    if (isPeriod(period)) {
      console.log(`     ${formatPeriodForDisplay(period)}`);
    }
  });
}

// Query 4: Minimal coverage periods (only one person)
const minimalCoverage = findMinimalCoverage(employees);
console.log(`\n4. Minimal Coverage (only 1 person working):`);
if (minimalCoverage.isEmpty()) {
  console.log('   ✅ Always have multiple people working');
} else {
  console.log('   ⚠️  Single-person coverage during:');
  minimalCoverage.periods().forEach(period => {
    if (isPeriod(period)) {
      // For minimal coverage, we need to identify who works at this time
      // We'll use the formatted display and add worker info if available
      const subjects = period.subjects;
      const worker= subjects.length > 0 ? (subjects[0] as string) : 'Unknown';
      console.log(`     ${formatPeriodForDisplay(period)} (${worker})`);
    }
  });
}

// ===== HOLIDAY IMPACT ANALYSIS =====

console.log('\n\n🏖️ Holiday Impact Analysis:');
console.log('============================');

// Calculate who would be working during Christmas break if there were no holidays
employees.forEach(employee => {
  const workDuringHolidays = employee.schedule.intersection(christmasBreak);
  
  console.log(`\n${employee.name}:`);
  if (workDuringHolidays.isEmpty()) {
    console.log('   🎉 Would not be scheduled to work during holiday period');
  } else {
    console.log('   📅 Would normally work during:');
    workDuringHolidays.periods().forEach(period => {
      if (isPeriod(period)) {
        console.log(`     ${formatPeriodForDisplay(period)}`);
      }
    });
  }
});

// ===== INDIVIDUAL EMPLOYEE HOLIDAYS =====

console.log('\n\n🎁 Individual Employee Holiday Periods:');
console.log('=======================================');

// Group holidays by employee for display
const holidaysByEmployee = individualHolidays.reduce((acc, holiday) => {
  acc[holiday.employee] ??= [];
  acc[holiday.employee]?.push(holiday);
  return acc;
}, {} as { [key: string]: EmployeeHoliday[] });

Object.entries(holidaysByEmployee).forEach(([employeeName, holidays]) => {
  console.log(`\n${employeeName}:`);
  holidays.forEach(holiday => {
    const date = new Date(holiday.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!holiday.startTime && !holiday.endTime) {
      console.log(`   🏖️  ${date} - Full day off (${holiday.reason})`);
    } else if (holiday.startTime && !holiday.endTime) {
      console.log(`   🕐  ${date} - Off from ${holiday.startTime} onwards (${holiday.reason})`);
    } else if (!holiday.startTime && holiday.endTime) {
      console.log(`   🕐  ${date} - Off until ${holiday.endTime} (${holiday.reason})`);
    } else {
      console.log(`   🕐  ${date} - Off from ${holiday.startTime} to ${holiday.endTime} (${holiday.reason})`);
    }
  });
});

console.log('\n💡 Notice how individual holidays are subtracted from regular work schedules,');
console.log('   demonstrating the power of the subtract() operation for complex scheduling!');

// ===== TEAM COLLABORATION ANALYSIS =====

console.log('\n\n🤝 Team Collaboration Opportunities:');
console.log('====================================');

// Find overlapping work periods between employees
const pairs = [
  { emp1: alice, emp2: bob, names: 'Alice & Bob' },
  { emp1: alice, emp2: carol, names: 'Alice & Carol' },
  { emp1: bob, emp2: carol, names: 'Bob & Carol' }
];

pairs.forEach(pair => {
  const overlap = pair.emp1.schedule.intersection(pair.emp2.schedule);
  console.log(`\n${pair.names} Collaboration Times:`);
  
  if (overlap.isEmpty()) {
    console.log('   ❌ No overlapping work hours');
  } else {
    console.log('   ✅ Can collaborate during:');
    overlap.periods().forEach(period => {
      if (isPeriod(period)) {
        console.log(`     ${formatPeriodForDisplay(period)}`);
      }
    });
  }
});

// ===== SUMMARY STATISTICS =====

console.log('\n\n📊 Schedule Summary Statistics:');
console.log('===============================');

const totalTeamCoverage = getTeamCoverage(employees);
const totalWorkPeriods = employees.reduce((sum, emp) => sum + emp.schedule.periods().length, 0);

console.log(`Total Work Periods Scheduled: ${totalWorkPeriods}`);
console.log(`Total Team Coverage Periods: ${totalTeamCoverage.periods().length}`);
console.log(`Full Team Collaboration Periods: ${fullTeamTimes.periods().length}`);
console.log(`Single-Person Coverage Periods: ${minimalCoverage.periods().length}`);

// Calculate total work hours for each employee (simplified calculation)
employees.forEach(employee => {
  const totalHours = employee.schedule.periods().reduce((sum, period) => {
    if (isPeriod(period)) {
      // Calculate duration using the new length() method
      const diffInMs = period.length();
      const hours = diffInMs / (1000 * 60 * 60);
      return sum + hours;
    }
    return sum;
  }, 0);
  
  console.log(`${employee.name}: ${totalHours.toFixed(1)} hours scheduled`);
});

console.log('\n✅ Holiday schedule analysis complete!');
console.log('\n💡 Key Insights:');
console.log('   - Use Period() with Date objects for realistic time management');
console.log('   - Leverage subjects (employee names) for tracking ownership');
console.log('   - Combine intersection(), subtract(), and union() for complex queries');
console.log('   - existsAt() provides instant point-in-time availability checks');
console.log('   - PeriodSeq automatically handles sorting and filtering');