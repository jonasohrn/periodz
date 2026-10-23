<template>
  <div class="query-panel">
    <div class="query-form">
      <h4>🕐 Check who works at a specific time</h4>
      <div class="input-group">
        <label for="query-date">Date:</label>
        <input 
          id="query-date"
          v-model="queryDate" 
          type="date" 
          min="2024-12-23" 
          max="2025-01-02"
        />
      </div>
      <div class="input-group">
        <label for="query-time">Time:</label>
        <input 
          id="query-time"
          v-model="queryTime" 
          type="time"
        />
      </div>
      <button @click="performQuery" class="query-button">
        🔍 Check Coverage
      </button>
    </div>

    <div v-if="queryResult" class="query-result">
      <h4>Results for {{ formatQueryDateTime() }}</h4>
      <div v-if="queryResult.workers.length === 0" class="no-workers">
        ❌ Nobody is working at this time
      </div>
      <div v-else class="workers-list">
        <div class="workers-count">
          ✅ {{ queryResult.workers.length }} person(s) working:
        </div>
        <ul>
          <li v-for="worker in queryResult.workers" :key="worker" class="worker-item">
            👤 {{ worker }}
          </li>
        </ul>
      </div>
    </div>

    <div class="predefined-queries">
      <h4>📋 Quick Queries</h4>
      <div class="quick-buttons">
        <button 
          v-for="query in quickQueries" 
          :key="query.label"
          @click="runQuickQuery(query)"
          class="quick-button"
        >
          {{ query.label }}
        </button>
      </div>
    </div>

    <div v-if="quickQueryResults.length > 0" class="quick-results">
      <h4>🔍 Quick Query Results</h4>
      <div v-for="result in quickQueryResults" :key="result.label" class="quick-result">
        <strong>{{ result.label }}:</strong>
        <span v-if="result.workers.length === 0" class="no-coverage">
          Nobody working
        </span>
        <span v-else class="has-coverage">
          {{ result.workers.join(', ') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Employee } from '../composables/useEmployees'

interface Props {
  employees: Employee[]
}

interface QueryResult {
  timestamp: Date
  workers: string[]
}

interface QuickQuery {
  label: string
  date: string
  time: string
}

const props = defineProps<Props>()

const queryDate = ref('2024-12-27')
const queryTime = ref('14:00')
const queryResult = ref<QueryResult | null>(null)
const quickQueryResults = ref<Array<{ label: string; workers: string[] }>>([])

const quickQueries: QuickQuery[] = [
  { label: 'Mon Dec 23, 9 AM', date: '2024-12-23', time: '09:00' },
  { label: 'Tue Dec 24, 2 PM', date: '2024-12-24', time: '14:00' },
  { label: 'Wed Dec 25, 10 AM', date: '2024-12-25', time: '10:00' },
  { label: 'Thu Dec 26, 3 PM', date: '2024-12-26', time: '15:00' },
  { label: 'Fri Dec 27, 11 AM', date: '2024-12-27', time: '11:00' }
]

const queryDateTime = computed(() => {
  return new Date(`${queryDate.value}T${queryTime.value}:00`)
})

function whoWorksAt(timestamp: Date): string[] {
  const workersAtTime: string[] = []
  
  props.employees.forEach(employee => {
    if (employee.schedule.existsAt(timestamp)) {
      workersAtTime.push(employee.name)
    }
  })
  
  return workersAtTime
}

function performQuery() {
  const workers = whoWorksAt(queryDateTime.value)
  queryResult.value = {
    timestamp: queryDateTime.value,
    workers
  }
}

function runQuickQuery(query: QuickQuery) {
  const timestamp = new Date(`${query.date}T${query.time}:00`)
  const workers = whoWorksAt(timestamp)
  
  const existingIndex = quickQueryResults.value.findIndex(r => r.label === query.label)
  const newResult = { label: query.label, workers }
  
  if (existingIndex >= 0) {
    quickQueryResults.value[existingIndex] = newResult
  } else {
    quickQueryResults.value.push(newResult)
  }
}

function formatQueryDateTime(): string {
  return queryDateTime.value.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.query-panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.query-form {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.input-group {
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
  gap: 1rem;
}

.input-group label {
  font-weight: bold;
  min-width: 60px;
}

.input-group input {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.query-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.query-button:hover {
  background: #0056b3;
}

.query-result {
  padding: 1rem;
  background: #e8f4f8;
  border-left: 4px solid #3498db;
  border-radius: 4px;
}

.query-result h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.no-workers {
  color: #e74c3c;
  font-weight: 500;
}

.workers-list {
  color: #27ae60;
}

.workers-count {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.worker-item {
  margin: 0.25rem 0;
  list-style: none;
}

.predefined-queries {
  padding: 1rem;
  background: #fff3cd;
  border-radius: 8px;
  border: 1px solid #ffeaa7;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.quick-button {
  background: #ffc107;
  color: #212529;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.quick-button:hover {
  background: #e0a800;
}

.quick-results {
  padding: 1rem;
  background: #d4edda;
  border-left: 4px solid #28a745;
  border-radius: 4px;
}

.quick-result {
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
}

.no-coverage {
  color: #dc3545;
  font-weight: 500;
}

.has-coverage {
  color: #28a745;
  font-weight: 500;
}

@media (prefers-color-scheme: dark) {
  .query-form {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .input-group input {
    background: #4a5568;
    border-color: #718096;
    color: #e2e8f0;
  }
  
  .query-result {
    background: #2d3748;
    border-left-color: #4a90e2;
    color: #e2e8f0;
  }
  
  .query-result h4 {
    color: #e2e8f0;
  }
  
  .predefined-queries {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .quick-results {
    background: #2d3748;
    border-left-color: #48bb78;
    color: #e2e8f0;
  }
  
  .quick-result {
    background: #4a5568;
    color: #e2e8f0;
  }
}
</style>