<template>
  <div class="coverage-analysis">
    <div class="analysis-section">
      <h4>⚠️ Coverage Gaps (No one working)</h4>
      <div v-if="coverageGaps.isEmpty()" class="success-message">
        ✅ No coverage gaps - someone is always working!
      </div>
      <div v-else>
        <div 
          v-for="(gap, index) in getCoverageGapPeriods()" 
          :key="index"
          class="coverage-gap"
        >
          {{ formatPeriod(gap) }}
        </div>
      </div>
    </div>

    <div class="analysis-section">
      <h4>👥 Full Team Coverage (All 3 employees working)</h4>
      <div v-if="fullTeamCoverage.isEmpty()" class="warning-message">
        ❌ No times when all team members work simultaneously
      </div>
      <div v-else>
        <div 
          v-for="(period, index) in getFullTeamPeriods()" 
          :key="index"
          class="full-coverage"
        >
          {{ formatPeriod(period) }}
        </div>
      </div>
    </div>

    <div class="analysis-section">
      <h4>⚠️ Minimal Coverage (Only 1 person working)</h4>
      <div v-if="minimalCoverage.isEmpty()" class="success-message">
        ✅ Always have multiple people working
      </div>
      <div v-else>
        <div 
          v-for="(period, index) in getMinimalCoveragePeriods()" 
          :key="index"
          class="coverage-gap"
        >
          {{ formatPeriod(period) }}
          <span v-if="period.subjects.length > 0" class="worker-info">
            ({{ period.subjects[0] }})
          </span>
        </div>
      </div>
    </div>

    <div class="analysis-section">
      <h4>🤝 Team Collaboration Opportunities</h4>
      <div v-for="pair in collaborationPairs" :key="pair.names" class="collaboration-pair">
        <h5>{{ pair.names }}</h5>
        <div v-if="pair.overlap.isEmpty()" class="warning-message">
          ❌ No overlapping work hours
        </div>
        <div v-else>
          <div class="success-message">✅ Can collaborate during:</div>
          <div 
            v-for="(period, index) in getCollaborationPeriods(pair.overlap)" 
            :key="index"
            class="full-coverage"
          >
            {{ formatPeriod(period) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { isPeriod, PeriodSeq, type IPeriod, type PeriodLike } from 'periodz'
import { usePeriodFormatting } from '../composables/usePeriodFormatting'
import { useCoverage } from '../composables/useCoverage'
import type { Employee } from '../composables/useEmployees'

interface Props {
  employees: Employee[]
  workWeek: PeriodLike
}

const props = defineProps<Props>()

const { formatPeriod } = usePeriodFormatting()
const { findCoverageGaps, findFullTeamCoverage, findMinimalCoverage } = useCoverage()

const coverageGaps = computed(() => findCoverageGaps(props.employees, props.workWeek))
const fullTeamCoverage = computed(() => findFullTeamCoverage(props.employees))
const minimalCoverage = computed(() => findMinimalCoverage(props.employees))

const collaborationPairs = computed(() => {
  const employees = props.employees
  return [
    { 
      names: `${employees[0]?.name} & ${employees[1]?.name}`, 
      overlap: employees[0]?.schedule.intersection(employees[1]?.schedule) || PeriodSeq([])
    },
    { 
      names: `${employees[0]?.name} & ${employees[2]?.name}`, 
      overlap: employees[0]?.schedule.intersection(employees[2]?.schedule) || PeriodSeq([])
    },
    { 
      names: `${employees[1]?.name} & ${employees[2]?.name}`, 
      overlap: employees[1]?.schedule.intersection(employees[2]?.schedule) || PeriodSeq([])
    }
  ]
})

function getCoverageGapPeriods(): IPeriod[] {
  return coverageGaps.value.periods().filter(isPeriod)
}

function getFullTeamPeriods(): IPeriod[] {
  return fullTeamCoverage.value.periods().filter(isPeriod)
}

function getMinimalCoveragePeriods(): IPeriod[] {
  return minimalCoverage.value.periods().filter(isPeriod)
}

function getCollaborationPeriods(overlap: PeriodLike): IPeriod[] {
  return overlap.periods().filter(isPeriod)
}
</script>

<style scoped>
.coverage-analysis {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.analysis-section {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
}

.analysis-section h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.analysis-section h5 {
  margin: 0.5rem 0;
  color: #34495e;
  font-size: 1rem;
}

.collaboration-pair {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.success-message {
  color: #27ae60;
  font-weight: 500;
  margin: 0.5rem 0;
}

.warning-message {
  color: #e74c3c;
  font-weight: 500;
  margin: 0.5rem 0;
}

.worker-info {
  color: #7f8c8d;
  font-size: 0.8em;
  margin-left: 0.5rem;
}

@media (prefers-color-scheme: dark) {
  .analysis-section {
    background: #2d3748;
    border-color: #4a5568;
  }
  
  .analysis-section h4 {
    color: #e2e8f0;
  }
  
  .analysis-section h5 {
    color: #cbd5e0;
  }
  
  .collaboration-pair {
    background: #4a5568;
  }
}
</style>