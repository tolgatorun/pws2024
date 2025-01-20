<script>
    const projectEndpoint = '/api/project'
    const personEndpoint = '/api/person'

    import TaskEditor from './TaskEditor.vue'

    export default {
        components: { TaskEditor },
        data() {
            return {
                personItems: [],
                isValid: false,
                input: {},
                taskDialog: false,
                selectedTask: null,
                rules: {
                    startsWithLetter: value => {
                        const pattern = /^\p{L}/u
                        return pattern.test(value) || 'It should start with a letter'
                    },
                    validDate: value => {
                        const date = new Date(value)
                        return !!date || 'Use a proper date'
                    }
                }
            }
        },
        props: [ 'project', 'persons' ],
        emits: [ 'close', 'listChanged' ],
        methods: {
           send() {
              fetch(projectEndpoint, {
                method: 'POST',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify(this.input)
              }).then(res => {
                res.json().then(data => {
                    if(!res.ok) {
                        this.$emit('close', data.error, 'error')
                    } else {
                        this.input = {}
                        this.$emit('close', `Project ${data.name} - added`)
                        this.$emit('listChanged')
                    }
                }).catch(err => {
                    this.$emit('close', 'Data discarded', 'error')
                })
              })
           },
           update() {
              fetch(projectEndpoint, {
                method: 'PUT',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify(this.input)
              }).then(res => {
                res.json().then(data => {
                    if(!res.ok) {
                        this.$emit('close', data.error, 'error')
                    } else {
                        this.input = {}
                        this.$emit('close', `Project ${data.name} - updated`)
                        this.$emit('listChanged')
                    }
                }).catch(err => {
                    this.$emit('close', 'Data discarded', 'error')
                })
              })
           },
           remove() {
              fetch(projectEndpoint + '?' + new URLSearchParams({ _id: this.input._id }), {
                method: 'DELETE'
              }).then(res => {
                res.json().then(data => {
                    if(!res.ok) {
                        this.$emit('close', data.error, 'error')
                    } else {
                        this.input = {}
                        this.$emit('close', `Project ${data.name} - deleted`)
                        this.$emit('listChanged')
                    }
                }).catch(err => {
                    this.$emit('close', 'Data discarded', 'error')
                })
              })
           },
           setData(data) {
              this.input = {}
              Object.assign(this.input, data)
           },
           clear() {
                this.input = { _id: this.input._id }
                this.isValid = false
           },
           close() {
                this.$emit('close')
           },
           openTaskDialog(task = null) {
                this.selectedTask = task
                this.taskDialog = true
           },
           onTaskClose(message) {
                this.taskDialog = false
                if (message) {
                    this.$emit('close', message)
                }
           },
           onTaskUpdate(task) {
                if (!this.input.tasks) {
                    this.input.tasks = []
                }
                
                if (task === null) {
                    // Delete task
                    const index = this.input.tasks.findIndex(t => t._id === this.selectedTask._id)
                    if (index !== -1) {
                        this.input.tasks.splice(index, 1)
                    }
                } else if (task._id) {
                    // Update task
                    const index = this.input.tasks.findIndex(t => t._id === task._id)
                    if (index !== -1) {
                        this.input.tasks.splice(index, 1, task)
                    }
                } else {
                    // Add new task
                    task._id = crypto.randomUUID()
                    this.input.tasks.push(task)
                }
           },
           getPersonName(workerId) {
               const person = this.personItems.find(p => p._id === workerId)
               return person ? `${person.firstName} ${person.lastName}` : 'Unknown'
           }
        },
        mounted() {
            Object.assign(this.input, this.project)
            if (!this.input.tasks) {
                this.input.tasks = []
            }
            fetch(personEndpoint + '?' + 
                    new URLSearchParams({ sort: 'lastName', order: 1 }).toString())
                .then(res => res.json().then(facet => {
                    this.personItems = facet.data
                }))
        }
    }
</script>

<template>
    <v-form v-model="isValid">
        <v-card>
            <v-card-title>{{ input._id ? 'Edit data' : 'Add data' }}</v-card-title>
            <v-card-subtitle>
                {{  input._id || 'new project' }}
            </v-card-subtitle>
            <v-card-text>
                <v-text-field variant="outlined" label="Name" v-model="input.name" :rules="[ rules.startsWithLetter ]">
                </v-text-field>
                <v-text-field type="date" variant="outlined" label="Start date" v-model="input.startDate" :rules="[ rules.validDate ]">
                </v-text-field>
                <v-text-field type="date" variant="outlined" label="End date" v-model="input.endDate" :rules="[ rules.validDate ]">
                </v-text-field>
                <v-autocomplete variant="outlined" v-model="input.contractor_ids"
                    chips label="Contractors" multiple
                    :items="personItems" :item-title="item => item.firstName + ' ' + item.lastName" item-value="_id"
                ></v-autocomplete>

                <!-- Tasks Section -->
                <v-divider class="my-4"></v-divider>
                <div class="d-flex align-center mb-4">
                    <h3 class="text-h6 mr-4">Tasks</h3>
                    <v-btn color="primary" variant="outlined" @click="openTaskDialog()">Add Task</v-btn>
                </div>
                
                <v-table v-if="input.tasks && input.tasks.length > 0">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Completed</th>
                            <th>Workers</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="task in input.tasks" :key="task._id">
                            <td>{{ task.name }}</td>
                            <td>{{ task.startDate }}</td>
                            <td>{{ task.endDate || '-' }}</td>
                            <td>
                                <v-icon :color="task.endDate ? 'success' : 'grey'">
                                    {{ task.endDate ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                                </v-icon>
                            </td>
                            <td>
                                <v-chip-group>
                                    <v-chip v-for="workerId in task.worker_ids" :key="workerId" size="small">
                                        {{ getPersonName(workerId) }}
                                    </v-chip>
                                </v-chip-group>
                            </td>
                            <td>
                                <v-btn icon="mdi-pencil" variant="text" density="compact" @click.stop="openTaskDialog(task)"></v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
                <v-alert v-else type="info" variant="tonal">
                    No tasks added yet
                </v-alert>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="elevated" @click="clear">Clear</v-btn>
                <v-btn color="primary" variant="elevated" @click="send" :disabled="!isValid" v-if="!input._id">Save</v-btn>
                <v-btn color="secondary" variant="elevated" @click="update" :disabled="!isValid" v-if="input._id">Update</v-btn>
                <v-btn color="error" variant="elevated" @click="remove" v-if="input._id">Delete</v-btn>
                <v-btn variant="elevated" @click="close">Close</v-btn>
            </v-card-actions>
        </v-card>

        <!-- Task Editor Dialog -->
        <v-dialog v-model="taskDialog" width="500px">
            <TaskEditor 
                v-if="taskDialog"
                :value="selectedTask"
                :persons="personItems"
                @update:modelValue="onTaskUpdate"
                @close="onTaskClose"
            />
        </v-dialog>
    </v-form>
</template>

<style scoped>
</style>