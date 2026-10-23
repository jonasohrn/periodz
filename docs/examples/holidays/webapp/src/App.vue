<template>
  <div id="app">
    <header>
      <h1>🏢 Periodz Holiday Schedule Manager</h1>
      <p>Interactive demonstration of the periodz library for holiday scheduling</p>
    </header>

    <div class="tab-container">
      <div class="tab-buttons">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-show="activeTab === 'employees'" class="section">
        <h2>👥 Employee Schedules</h2>
        <EmployeeList :employees="employees" />
      </div>

      <div v-show="activeTab === 'holidays'" class="section">
        <h2>🎁 Individual Holidays</h2>
        <HolidayList :holidays="holidays" />
      </div>

      <div v-show="activeTab === 'coverage'" class="section">
        <h2>📊 Coverage Analysis</h2>
        <CoverageAnalysis :employees="employees" :work-week="workWeek" />
      </div>

      <div v-show="activeTab === 'query'" class="section">
        <h2>🔍 Who Works When?</h2>
        <QueryPanel :employees="employees" />
      </div>

      <div v-show="activeTab === 'stats'" class="section">
        <h2>📈 Statistics</h2>
        <StatsPanel :employees="employees" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EmployeeList from './components/EmployeeList.vue'
import HolidayList from './components/HolidayList.vue'
import CoverageAnalysis from './components/CoverageAnalysis.vue'
import QueryPanel from './components/QueryPanel.vue'
import StatsPanel from './components/StatsPanel.vue'
import { useEmployees } from './composables/useEmployees'
import { useHolidays } from './composables/useHolidays'

const activeTab = ref('employees')

const tabs = [
  { id: 'employees', label: '👥 Employees' },
  { id: 'holidays', label: '🎁 Holidays' },
  { id: 'coverage', label: '📊 Coverage' },
  { id: 'query', label: '🔍 Query' },
  { id: 'stats', label: '📈 Stats' }
]

const { employees, workWeek } = useEmployees()
const { holidays } = useHolidays()
</script>