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
                                <v-tooltip location="top">
                                    <template v-slot:activator="{ props }">
                                        <div class="bar-content" v-bind="props">
                                            {{ project.name }}
                                            <span class="date-info">
                                                {{ formatDateFull(project.startDate) }} - 
                                                {{ project.endDate ? formatDateFull(project.endDate) : 'Ongoing' }}
                                            </span>
                                        </div>
                                    </template>
                                    <div class="tooltip-content">
                                        <strong>{{ project.name }}</strong><br>
                                        Start: {{ formatDateFull(project.startDate) }}<br>
                                        {{ project.endDate ? 'End: ' + formatDateFull(project.endDate) : 'Status: Ongoing' }}<br>
                                        Duration: {{ getDuration(project.startDate, project.endDate || currentDate) }}
                                    </div>
                                </v-tooltip>
                            </div>
                        </div>
                    </div>
                    <div class="gantt-timeline">
                        <div v-for="date in timelineLabels" :key="date" class="timeline-marker">
                            <div class="timeline-label">
                                <div class="timeline-date">{{ formatTimelineDate(date).top }}</div>
                                <div class="timeline-week">{{ formatTimelineDate(date).bottom }}</div>
                            </div>
                            <div class="timeline-line"></div>
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
                                <v-tooltip location="top">
                                    <template v-slot:activator="{ props }">
                                        <div class="bar-content" v-bind="props">
                                            {{ task.name }}
                                            <span class="date-info">
                                                {{ formatDateFull(task.startDate) }} - 
                                                {{ task.endDate ? formatDateFull(task.endDate) : 'Ongoing' }}
                                            </span>
                                        </div>
                                    </template>
                                    <div class="tooltip-content">
                                        <strong>{{ task.name }}</strong><br>
                                        Start: {{ formatDateFull(task.startDate) }}<br>
                                        {{ task.endDate ? 'End: ' + formatDateFull(task.endDate) : 'Status: Ongoing' }}<br>
                                        Duration: {{ getDuration(task.startDate, task.endDate || currentDate) }}
                                    </div>
                                </v-tooltip>
                            </div>
                        </div>
                    </div>
                    <div class="gantt-timeline">
                        <div v-for="date in taskTimelineLabels" :key="date" class="timeline-marker">
                            <div class="timeline-label">
                                <div class="timeline-date">{{ formatTimelineDate(date).top }}</div>
                                <div class="timeline-week">{{ formatTimelineDate(date).bottom }}</div>
                            </div>
                            <div class="timeline-line"></div>
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
            taskTimelineEnd: null,
            ws: null,
            isDestroyed: false
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
            
            // Calculate optimal interval based on duration
            const totalDays = Math.ceil((endDate - current) / (1000 * 60 * 60 * 24))
            let intervalDays = 7 // default to weekly
            if (totalDays > 90) intervalDays = 30 // monthly for longer periods
            if (totalDays > 365) intervalDays = 90 // quarterly for very long periods
            
            while (current <= endDate) {
                dates.push(current.toISOString().split('T')[0])
                current.setDate(current.getDate() + intervalDays)
            }
            
            // Always include the end date
            if (dates[dates.length - 1] !== endDate.toISOString().split('T')[0]) {
                dates.push(endDate.toISOString().split('T')[0])
            }
            
            return dates
        },
        formatTimelineDate(date) {
            const d = new Date(date)
            const month = d.toLocaleString('en-US', { month: 'short' })
            const year = d.getFullYear()
            
            // Get week number for the date
            const startOfYear = new Date(year, 0, 1)
            const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000))
            const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7)
            
            return {
                top: `${month} ${year}`,
                bottom: `Week ${weekNum}`
            }
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
                day: 'numeric',
                year: 'numeric'
            })
        },
        formatDateFull(date) {
            return new Date(date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        },
        getDuration(startDate, endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
            
            if (days < 30) {
                return `${days} day${days !== 1 ? 's' : ''}`
            } else if (days < 365) {
                const months = Math.floor(days / 30)
                const remainingDays = days % 30
                return `${months} month${months !== 1 ? 's' : ''}`
                    + (remainingDays ? ` ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : '')
            } else {
                const years = Math.floor(days / 365)
                const remainingMonths = Math.floor((days % 365) / 30)
                return `${years} year${years !== 1 ? 's' : ''}`
                    + (remainingMonths ? ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : '')
            }
        },
        initWebSocket() {
            if (this.ws) {
                this.ws.close()
            }

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
            const wsUrl = `${protocol}//${window.location.host}/ws`
            
            this.ws = new WebSocket(wsUrl)
            
            this.ws.onopen = () => {
                console.log('WebSocket connected')
            }

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.type === 'project_update') {
                        console.log('Received project update:', data)
                        this.fetchProjects()
                    }
                } catch (err) {
                    console.error('WebSocket message parsing error:', err)
                }
            }

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error)
            }

            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason)
                // Only try to reconnect if the component is still mounted
                if (!this.isDestroyed) {
                    setTimeout(() => this.initWebSocket(), 3000)
                }
            }
        },
    },
    watch: {
        selectedProject() {
            this.updateTaskTimelineBounds()
        }
    },
    mounted() {
        this.fetchProjects()
        this.initWebSocket()
    },
    beforeUnmount() {
        this.isDestroyed = true
        if (this.ws) {
            this.ws.close()
        }
    }
}
</script>

<style scoped>
.gantt-container {
    position: relative;
    margin: 20px 0;
    padding-top: 40px;
    overflow-x: auto;
}

.gantt-row {
    display: flex;
    margin-bottom: 10px;
    height: 40px;
    align-items: center;
}

.gantt-label {
    min-width: 150px;
    padding-right: 10px;
    text-align: right;
    font-weight: 500;
    position: sticky;
    left: 0;
    background: white;
    z-index: 1;
}

.gantt-bar-container {
    flex: 1;
    position: relative;
    height: 30px;
    background-color: #f5f5f5;
    border-radius: 4px;
    min-width: 800px;
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
    transition: all 0.3s ease;
}

.gantt-bar:hover {
    height: 110%;
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.gantt-bar.ongoing {
    background-color: #FFA726;
}

.bar-content {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.date-info {
    font-size: 0.75rem;
    opacity: 0.9;
}

.gantt-timeline {
    position: absolute;
    top: 0;
    left: 150px;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 10px;
    min-width: 800px;
    height: 50px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.timeline-marker {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.timeline-label {
    text-align: center;
    padding: 4px 8px;
    background: white;
    border-radius: 4px;
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.7);
    white-space: nowrap;
    z-index: 1;
}

.timeline-date {
    font-weight: 500;
    margin-bottom: 2px;
}

.timeline-week {
    font-size: 0.7rem;
    color: rgba(0, 0, 0, 0.5);
}

.timeline-line {
    position: absolute;
    top: 100%;
    left: 50%;
    bottom: -1000px;
    width: 1px;
    background: rgba(0, 0, 0, 0.1);
    pointer-events: none;
}

.tooltip-content {
    text-align: left;
    line-height: 1.5;
}
</style>
