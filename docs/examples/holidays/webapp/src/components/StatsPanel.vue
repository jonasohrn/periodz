<template>
  <div class="stats-panel">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ totalWorkPeriods }}</div>
        <div class="stat-label">Total Work Periods</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ teamCoveragePeriods }}</div>
        <div class="stat-label">Team Coverage Periods</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ fullTeamPeriods }}</div>
        <div class="stat-label">Full Team Collaboration</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{{ minimalCoveragePeriods }}</div>
        <div class="stat-label">Single-Person Coverage</div>
      </div>
    </div>

    <div class="employee-hours">
      <h4>📊 Individual Work Hours</h4>
      <div class="hours-list">
        <div v-for="employee in employees" :key="employee.name" class="hour-item">
          <div class="employee-name">{{ employee.name }}</div>
          <div class="employee-hours">{{ calculateEmployeeHours(employee) }} hours</div>
          <div class="hours-bar">
            <div 
              class="hours-fill" 
              :style="{ width: `${(calculateEmployeeHoursNumber(employee) / maxHours) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="coverage-summary">
      <h4>📈 Coverage Summary</h4>
      <div class="summary-items">
        <div class="summary-item">
          <span class="summary-label">Total Team Hours:</span>
          <span class="summary-value">{{ totalTeamHours.toFixed(1) }} hours</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Average per Employee:</span>
          <span class="summary-value">{{ averageHoursPerEmployee.toFixed(1) }} hours</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Coverage Efficiency:</span>
          <span class="summary-value">{{ coverageEfficiency.toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <div class="insights">
      <h4>💡 Key Insights</h4>
      <ul class="insight-list">
        <li>Use Period() with Date objects for realistic time management</li>
        <li>Leverage subjects (employee names) for tracking ownership</li>
        <li>Combine intersection(), subtract(), and union() for complex queries</li>
        <li>existsAt() provides instant point-in-time availability checks</li>
        <li>PeriodSeq automatically handles sorting and filtering</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { isPeriod } from 'periodz'
import { useCoverage } from '../composables/useCoverage'
import type { Employee } from '../composables/useEmployees'

interface Props {
  employees: Employee[]
}

const props = defineProps<Props>()

const { getTeamCoverage, findFullTeamCoverage, findMinimalCoverage } = useCoverage()

const totalWorkPeriods = computed(() => {
  return props.employees.reduce((sum, emp) => sum + emp.schedule.periods().length, 0)
})

const teamCoverage = computed(() => getTeamCoverage(props.employees))
const fullTeamCoverage = computed(() => findFullTeamCoverage(props.employees))
const minimalCoverage = computed(() => findMinimalCoverage(props.employees))

const teamCoveragePeriods = computed(() => teamCoverage.value.periods().length)
const fullTeamPeriods = computed(() => fullTeamCoverage.value.periods().length)
const minimalCoveragePeriods = computed(() => minimalCoverage.value.periods().length)

const totalTeamHours = computed(() => {
  return props.employees.reduce((sum, emp) => sum + calculateEmployeeHoursNumber(emp), 0)
})

const averageHoursPerEmployee = computed(() => {
  return props.employees.length > 0 ? totalTeamHours.value / props.employees.length : 0
})

const maxHours = computed(() => {
  return Math.max(...props.employees.map(emp => calculateEmployeeHoursNumber(emp)))
})

const coverageEfficiency = computed(() => {
  if (teamCoveragePeriods.value === 0) return 0
  return (fullTeamPeriods.value / teamCoveragePeriods.value) * 100
})

function calculateEmployeeHours(employee: Employee): string {
  return calculateEmployeeHoursNumber(employee).toFixed(1)
}

function calculateEmployeeHoursNumber(employee: Employee): number {
  return employee.schedule.periods().reduce((sum, period) => {
    if (isPeriod(period)) {
      const diffInMs = period.length()
      const hours = diffInMs / (1000 * 60 * 60)
      return sum + hours
    }
    return sum
  }, 0)
}
</script>

<style scoped>
.stats-panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6c757d;
  font-size: 0.9rem;
}

.employee-hours {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
}

.employee-hours h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.hours-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hour-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.employee-name {
  min-width: 120px;
  font-weight: 500;
}

.employee-hours {
  min-width: 80px;
  font-family: monospace;
}

.hours-bar {
  flex: 1;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.hours-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  transition: width 0.3s ease;
}

.coverage-summary {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1.5rem;
}

.coverage-summary h4 {
  margin: 0 0 1rem 0;
  color: #856404;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-weight: 500;
}

.summary-value {
  font-family: monospace;
  font-weight: bold;
  color: #495057;
}

.insights {
  background: #e8f4f8;
  border: 1px solid #bee5eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.insights h4 {
  margin: 0 0 1rem 0;
  color: #0c5460;
}

.insight-list {
  margin: 0;
  padding-left: 1.5rem;
}

.insight-list li {
  margin: 0.5rem 0;
  color: #495057;
}

@media (prefers-color-scheme: dark) {
  .stat-card,
  .employee-hours {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .employee-hours h4 {
    color: #e2e8f0;
  }
  
  .stat-value {
    color: #4a90e2;
  }
  
  .stat-label {
    color: #a0aec0;
  }
  
  .hours-bar {
    background: #4a5568;
  }
  
  .coverage-summary {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .coverage-summary h4 {
    color: #e2e8f0;
  }
  
  .summary-value {
    color: #e2e8f0;
  }
  
  .insights {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .insights h4 {
    color: #e2e8f0;
  }
  
  .insight-list li {
    color: #cbd5e0;
  }
}

@media (max-width: 768px) {
  .hour-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .summary-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
  }
}
</style>