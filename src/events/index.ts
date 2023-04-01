import { Event } from '../types'
import ready from './ready'
import interactionCreate from './interactionCreate'

// This is the array of events
const events: Event<any>[] = [
    ...interactionCreate,
    ready,
]

export default events