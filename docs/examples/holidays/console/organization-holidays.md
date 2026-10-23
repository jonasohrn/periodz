# Organization Holiday Management with Periodz

This example demonstrates how to use the periodz library to manage an organization's holiday situation, showing work schedules, holiday periods, and team coverage analysis.

## Scenario: TechCorp Solutions

**Company**: TechCorp Solutions - A small tech company  
**Holiday Period**: December 23, 2024 - January 2, 2025 (Christmas/New Year break)

### Employees

Our example organization has 3 employees with different work patterns:

1. **Alice Chen** (Full-time Developer)
   - Works: Monday to Friday, 9 AM - 5 PM
   - Role: Senior Software Engineer

2. **Bob Martinez** (Part-time Designer)  
   - Works: Tuesday, Wednesday, Thursday, 10 AM - 4 PM
   - Role: UI/UX Designer

3. **Carol Johnson** (Project Manager)
   - Works: Monday, Wednesday, Friday, 8 AM - 6 PM
   - Role: Project Manager

## Key Use Cases

This example showcases how periodz can solve common workforce management questions:

### 🔍 Point-in-Time Queries
- "Who works on December 27th?"
- "Is anyone available for an emergency on January 1st?"
- "Who can attend a meeting on Wednesday at 2 PM?"

### 📊 Coverage Analysis
- "When does nobody work?" (Coverage gaps)
- "What periods have minimal coverage?" (Only 1 person)
- "When do all team members work simultaneously?"

### 🏖️ Holiday Impact Assessment
- "How many work hours are lost during the holiday?"
- "Which employees will be working during the break?"
- "What are the backup coverage scenarios?"

### ⚡ Team Coordination
- "Who has overlapping schedules for collaboration?"
- "What's the total team coverage throughout the week?"
- "When should we schedule team meetings?"

## Implementation

The complete implementation demonstrates:

### 1. Employee Schedule Modeling
```typescript
// Create work periods for each employee using Date objects and subjects
const alice = createEmployeeWorkWeek(
  'Alice Chen',
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  9, 17 // 9 AM to 5 PM
);
```

### 2. Holiday Period Management
```typescript
// Define company holidays
const christmasBreak = Period(
  new Date('2024-12-23T00:00:00'),
  new Date('2025-01-02T23:59:59'),
  'Christmas Break'
);
```

### 3. Coverage Analysis
```typescript
// Find when nobody works (coverage gaps)
const coverageGaps = findCoverageGaps([alice, bob, carol], workWeek);

// Check who works at a specific time
const workersAt2PM = whoWorksAt(new Date('2024-12-27T14:00:00'), [alice, bob, carol]);
```

### 4. Practical Business Queries
The implementation includes helper functions for common business questions:

- `whoWorksAt(timestamp, employees)` - Find who's working at a specific time
- `findCoverageGaps(employees, timeRange)` - Identify periods with no coverage
- `getTeamCoverage(employees)` - Calculate total team availability
- `findMinimalCoverage(employees)` - Find periods with only one person working
- `calculateWorkHours(employee, period)` - Calculate total work hours in a period

## Period Operations Used

This example demonstrates these key periodz operations:

- **Period()** - Creating time intervals with start/end dates and subjects
- **PeriodSeq()** - Managing collections of work periods
- **intersection()** - Finding overlapping work times
- **subtract()** - Calculating availability after removing holidays
- **union()** - Combining multiple schedules
- **existsAt()** - Point-in-time availability checks
- **periodsAt()** - Finding all periods active at a specific time

## Real-World Applications

This pattern can be extended for:

- **Resource Scheduling**: Meeting rooms, equipment, vehicles
- **Shift Management**: 24/7 operations, rotating schedules
- **Project Planning**: Task assignments, deadline management
- **Event Planning**: Venue availability, staff coordination
- **Maintenance Windows**: System downtime, service interruptions

## Running the Example

The complete implementation is available in `organization-holidays.ts` and can be run in multiple ways:

### Option 1: Using npm scripts (Recommended)
```bash
# Run the full TypeScript example
npm run example:holiday

```

### Option 2: Direct execution with tsx
```bash
# Using tsx (modern TypeScript executor)
npx tsx docs/examples/holidays/console/organization-holidays.ts
```

### Option 3: Traditional ts-node (if you have it installed)
```bash
# Using ts-node with ESM support
npx ts-node --esm docs/examples/holidays/console/organization-holidays.ts
```

### What the example includes:
- Full TypeScript code with proper typing
- Helper functions for common operations
- Sample queries and their results
- Comprehensive comments explaining each operation
- Real business scenarios and use cases

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- The periodz project dependencies installed (`npm install`)

### Troubleshooting
If you encounter issues running the example:

1. **"Cannot find module" errors**: Ensure you've run `npm install` in the project root
2. **TypeScript errors**: The example uses the latest TypeScript features and requires TypeScript 5.0+
3. **ESM module issues**: Use `tsx` instead of `ts-node` for better ESM support
4. **ts-node problems**: Try `npx tsx` as a modern alternative that handles ESM modules better

### Expected Output
The example produces detailed output showing:
- Employee work schedules
- Holiday period definitions  
- Coverage gap analysis
- Team collaboration opportunities
- Schedule statistics and insights

## Key Insights

This example demonstrates that periodz excels at:

1. **Complex Time Logic**: Handling overlapping schedules, gaps, and intersections
2. **Metadata Tracking**: Using subjects to track who, what, or why for each period
3. **Business Rule Modeling**: Translating workforce policies into period operations
4. **Performance**: Efficient algorithms for large-scale schedule analysis
5. **Type Safety**: Full TypeScript support for robust applications

The periodz library transforms complex workforce management calculations into simple, readable operations that directly map to business questions.