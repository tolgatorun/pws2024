<template>
    <v-container>
        <h2 class="text-h4 mb-4">Project Timeline Analysis</h2>
        
        <!-- Projects Gantt -->
        <v-card class="mb-6">
            <v-card-title>Projects Timeline</v-card-title>
            <v-card-text>
                <div class="gantt-container">
                    <div v-for="project in projects" :key="project._id" class="gantt-row">
                        <div class="gantt-label">{{ project.name }}</div>
                        <div class="gantt-bar-container">
                            <div 
                                class="gantt-bar" 
                                :class="{ 'ongoing': !project.endDate }"
                                :style="getBarStyle(project.startDate, project.endDate || currentDate)"
                            >
                                {{ project.name }}
                            </div>
                        </div>
                    </div>
                    <div class="gantt-timeline">
                        <div v-for="date in timelineLabels" :key="date" class="timeline-label">
                            {{ formatDate(date) }}
                        </div>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <!-- Project Selection -->
        <v-card class="mb-6">
            <v-card-text>
                <v-select
                    v-model="selectedProject"
                    :items="projects"
                    item-title="name"
                    item-value="_id"
                    label="Select Project to View Tasks"
                    variant="outlined"
                ></v-select>
            </v-card-text>
        </v-card>

        <!-- Tasks Gantt -->
        <v-card v-if="selectedProject">
            <v-card-title>Tasks Timeline for {{ selectedProjectName }}</v-card-title>
            <v-card-text>
                <div class="gantt-container" v-if="selectedProjectTasks.length > 0">
                    <div v-for="task in selectedProjectTasks" :key="task._id" class="gantt-row">
                        <div class="gantt-label">{{ task.name }}</div>
                        <div class="gantt-bar-container">
                            <div 
                                class="gantt-bar" 
                                :class="{ 'ongoing': !task.endDate }"
                                :style="getBarStyle(task.startDate, task.endDate || currentDate)"
                            >
                                {{ task.name }}
                            </div>
                        </div>
                    </div>
                    <div class="gantt-timeline">
                        <div v-for="date in taskTimelineLabels" :key="date" class="timeline-label">
                            {{ formatDate(date) }}
                        </div>
                    </div>
                </div>
                <v-alert v-else type="info" variant="tonal">
                    No tasks found for this project
                </v-alert>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script>
export default {
    data() {
        return {
            projects: [],
            selectedProject: null,
            currentDate: new Date().toISOString().split('T')[0],
            timelineStart: null,
            timelineEnd: null,
            taskTimelineStart: null,
            taskTimelineEnd: null
        }
    },
    computed: {
        selectedProjectName() {
            const project = this.projects.find(p => p._id === this.selectedProject)
            return project ? project.name : ''
        },
        selectedProjectTasks() {
            const project = this.projects.find(p => p._id === this.selectedProject)
            return project ? project.tasks || [] : []
        },
        timelineLabels() {
            return this.generateTimelineLabels(this.timelineStart, this.timelineEnd)
        },
        taskTimelineLabels() {
            if (!this.selectedProject) return []
            return this.generateTimelineLabels(this.taskTimelineStart, this.taskTimelineEnd)
        }
    },
    methods: {
        fetchProjects() {
            fetch('/api/project')
                .then(res => res.json())
                .then(data => {
                    this.projects = data.data
                    this.updateTimelineBounds()
                })
        },
        updateTimelineBounds() {
            // Find the earliest start date and latest end date for projects
            let earliest = this.currentDate
            let latest = this.currentDate

            this.projects.forEach(project => {
                if (project.startDate < earliest) {
                    earliest = project.startDate
                }
                const endDate = project.endDate || this.currentDate
                if (endDate > latest) {
                    latest = endDate
                }
            })

            this.timelineStart = earliest
            this.timelineEnd = latest
        },
        updateTaskTimelineBounds() {
            if (!this.selectedProject) return

            const tasks = this.selectedProjectTasks
            if (tasks.length === 0) return

            // Find the earliest start date and latest end date for tasks
            let earliest = this.currentDate
            let latest = this.currentDate

            tasks.forEach(task => {
                if (task.startDate < earliest) {
                    earliest = task.startDate
                }
                const endDate = task.endDate || this.currentDate
                if (endDate > latest) {
                    latest = endDate
                }
            })

            this.taskTimelineStart = earliest
            this.taskTimelineEnd = latest
        },
        generateTimelineLabels(start, end) {
            if (!start || !end) return []
            
            const dates = []
            let current = new Date(start)
            const endDate = new Date(end)
            
            while (current <= endDate) {
                dates.push(current.toISOString().split('T')[0])
                current.setDate(current.getDate() + 14) // Two-week intervals
            }
            
            return dates
        },
        getBarStyle(startDate, endDate) {
            const timelineStart = new Date(this.timelineStart)
            const timelineEnd = new Date(this.timelineEnd)
            const duration = timelineEnd - timelineStart
            
            const start = new Date(startDate)
            const end = new Date(endDate)
            
            const left = ((start - timelineStart) / duration) * 100
            const width = ((end - start) / duration) * 100
            
            return {
                left: `${left}%`,
                width: `${width}%`
            }
        },
        formatDate(date) {
            return new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            })
        }
    },
    watch: {
        selectedProject() {
            this.updateTaskTimelineBounds()
        }
    },
    mounted() {
        this.fetchProjects()
    }
}
</script>

<style scoped>
.gantt-container {
    position: relative;
    margin: 20px 0;
    padding-top: 30px;
}

.gantt-row {
    display: flex;
    margin-bottom: 10px;
    height: 40px;
    align-items: center;
}

.gantt-label {
    width: 150px;
    padding-right: 10px;
    text-align: right;
    font-weight: 500;
}

.gantt-bar-container {
    flex: 1;
    position: relative;
    height: 30px;
    background-color: #f5f5f5;
    border-radius: 4px;
}

.gantt-bar {
    position: absolute;
    height: 100%;
    background-color: #1976D2;
    border-radius: 4px;
    color: white;
    padding: 0 8px;
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.gantt-bar.ongoing {
    background-color: #FFA726;
}

.gantt-timeline {
    position: absolute;
    top: 0;
    left: 150px;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 10px;
}

.timeline-label {
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.6);
    transform: rotate(-45deg);
    transform-origin: left;
    white-space: nowrap;
}
</style>
