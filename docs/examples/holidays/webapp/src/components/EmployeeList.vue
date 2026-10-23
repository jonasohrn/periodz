<template>
  <div class="employee-list">
    <div v-for="employee in employees" :key="employee.name" class="employee-card">
      <div class="employee-header">
        <div class="employee-name">{{ employee.name }}</div>
        <div class="employee-role">{{ employee.role }}</div>
      </div>
      
      <div class="employee-schedule">
        <h4>📅 Work Schedule (after holidays applied):</h4>
        <div v-if="employee.schedule.isEmpty()" class="no-schedule">
          No work periods scheduled
        </div>
        <div v-else>
          <div 
            v-for="(period, index) in getSchedulePeriods(employee)" 
            :key="index"
            class="schedule-period"
          >
            {{ formatPeriod(period) }}
            <span v-if="period.subjects.length > 0" class="subject">
              ({{ period.subjects.join(', ') }})
            </span>
          </div>
        </div>
        
        <div class="schedule-stats">
          <strong>Total hours:</strong> {{ calculateTotalHours(employee) }} hours
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isPeriod, type IPeriod } from 'periodz'
import { usePeriodFormatting } from '../composables/usePeriodFormatting'
import type { Employee } from '../composables/useEmployees'

interface Props {
  employees: Employee[]
}

defineProps<Props>()

const { formatPeriod } = usePeriodFormatting()

function getSchedulePeriods(employee: Employee): IPeriod[] {
  return employee.schedule.periods().filter(isPeriod)
}

function calculateTotalHours(employee: Employee): string {
  const totalHours = employee.schedule.periods().reduce((sum, period) => {
    if (isPeriod(period)) {
      const diffInMs = period.length()
      const hours = diffInMs / (1000 * 60 * 60)
      return sum + hours
    }
    return sum
  }, 0)
  
  return totalHours.toFixed(1)
}
</script>

<style scoped>
.employee-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.employee-header {
  margin-bottom: 1rem;
}

.employee-schedule h4 {
  margin: 0.5rem 0;
  color: #34495e;
}

.no-schedule {
  color: #7f8c8d;
  font-style: italic;
  padding: 0.5rem;
}

.subject {
  color: #7f8c8d;
  font-size: 0.8em;
}

.schedule-stats {
  margin-top: 1rem;
  padding: 0.5rem;
  background: #ecf0f1;
  border-radius: 4px;
  font-size: 0.9em;
}

@media (prefers-color-scheme: dark) {
  .employee-schedule h4 {
    color: #e2e8f0;
  }
  
  .schedule-stats {
    background: #4a5568;
    color: #e2e8f0;
  }
}
</style>