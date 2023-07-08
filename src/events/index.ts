import { Event } from '../types'
import ready from './ready'
import interactionCreate from './interactionCreate'
import antiSpam from './antiSpam'

// This is the array of events
const events: Event<any>[] = [
    ...interactionCreate,
    ready,
    antiSpam
]

export default events