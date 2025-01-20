<template>
    <v-form v-model="isValid">
        <v-card>
            <v-card-title>{{ task._id ? 'Edit task' : 'Add task' }}</v-card-title>
            <v-card-text>
                <v-text-field variant="outlined" label="Name" v-model="task.name" :rules="[ rules.startsWithLetter ]">
                </v-text-field>
                <v-text-field type="date" variant="outlined" label="Start date" v-model="task.startDate" :rules="[ rules.required, rules.validDate ]">
                </v-text-field>
                <v-text-field 
                    type="date" 
                    variant="outlined" 
                    label="End date (setting this will mark task as completed)" 
                    v-model="task.endDate" 
                    :rules="[ rules.validDate, rules.endDateAfterStart ]"
                    :min="task.startDate"
                    clearable
                >
                </v-text-field>
                <v-autocomplete variant="outlined" v-model="task.worker_ids"
                    chips label="Workers" multiple
                    :items="personItems" :item-title="item => item.firstName + ' ' + item.lastName" item-value="_id"
                ></v-autocomplete>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="elevated" @click="clear">Clear</v-btn>
                <v-btn color="primary" variant="elevated" @click="save" :disabled="!isValid">Save</v-btn>
                <v-btn color="error" variant="elevated" @click="remove" v-if="task._id">Delete</v-btn>
                <v-btn variant="elevated" @click="close">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-form>
</template>

<script>
export default {
    data() {
        return {
            isValid: false,
            task: {},
            personItems: [],
            rules: {
                required: value => !!value || 'This field is required',
                startsWithLetter: value => {
                    const pattern = /^\p{L}/u
                    return pattern.test(value) || 'It should start with a letter'
                },
                validDate: value => {
                    if (!value) return true // Allow empty for end date
                    const date = new Date(value)
                    return !!date || 'Use a proper date'
                },
                endDateAfterStart: value => {
                    if (!value) return true // Allow empty for end date
                    if (!this.task.startDate) return true // Skip if no start date
                    return value >= this.task.startDate || 'End date must be after start date'
                }
            }
        }
    },
    props: ['value', 'persons'],
    emits: ['update:modelValue', 'close'],
    methods: {
        save() {
            this.$emit('update:modelValue', this.task)
            this.$emit('close', 'Task saved')
        },
        remove() {
            this.$emit('update:modelValue', null)
            this.$emit('close', 'Task deleted')
        },
        clear() {
            this.task = { _id: this.task._id }
            this.isValid = false
        },
        close() {
            this.$emit('close')
        }
    },
    mounted() {
        this.task = this.value || {}
        this.personItems = this.persons || []
    }
}
</script>

<style scoped>
</style>
