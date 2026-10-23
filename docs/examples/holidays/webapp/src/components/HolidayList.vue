<template>
  <div class="holiday-list">
    <div v-for="(employeeHolidays, employeeName) in groupedHolidays" :key="employeeName" class="employee-holidays">
      <h3>{{ employeeName }}</h3>
      <div v-for="holiday in employeeHolidays" :key="`${holiday.employee}-${holiday.date}`" class="holiday-period">
        <div class="holiday-date">
          {{ formatHolidayDate(holiday.date) }}
        </div>
        <div class="holiday-time">
          {{ formatHolidayTime(holiday) }}
        </div>
        <div class="holiday-reason">
          {{ holiday.reason }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EmployeeHoliday } from '../composables/useHolidays'

interface Props {
  holidays: EmployeeHoliday[]
}

const props = defineProps<Props>()

const groupedHolidays = computed(() => {
  return props.holidays.reduce((acc, holiday) => {
    if (!acc[holiday.employee]) {
      acc[holiday.employee] = []
    }
    acc[holiday.employee].push(holiday)
    return acc
  }, {} as { [key: string]: EmployeeHoliday[] })
})

function formatHolidayDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

function formatHolidayTime(holiday: EmployeeHoliday): string {
  if (!holiday.startTime && !holiday.endTime) {
    return '🏖️ Full day off'
  } else if (holiday.startTime && !holiday.endTime) {
    return `🕐 Off from ${holiday.startTime} onwards`
  } else if (!holiday.startTime && holiday.endTime) {
    return `🕐 Off until ${holiday.endTime}`
  } else {
    return `🕐 Off from ${holiday.startTime} to ${holiday.endTime}`
  }
}
</script>

<style scoped>
.holiday-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.employee-holidays h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
}

.holiday-period {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #fdf2e9;
  border-left: 4px solid #e67e22;
  border-radius: 4px;
}

.holiday-date {
  font-weight: bold;
  color: #d35400;
  margin-bottom: 0.3rem;
}

.holiday-time {
  color: #8e44ad;
  margin-bottom: 0.3rem;
  font-size: 0.9em;
}

.holiday-reason {
  color: #7f8c8d;
  font-style: italic;
  font-size: 0.9em;
}

@media (prefers-color-scheme: dark) {
  .employee-holidays h3 {
    color: #e2e8f0;
    border-bottom-color: #4a90e2;
  }
  
  .holiday-period {
    background: #3d3d3d;
    border-left-color: #e67e22;
  }
  
  .holiday-date {
    color: #f39c12;
  }
  
  .holiday-time {
    color: #bb86fc;
  }
  
  .holiday-reason {
    color: #a0a0a0;
  }
}
</style>