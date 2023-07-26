import { Event } from '../types'
import ready from './ready'
import interactionCreate from './interactionCreate'
import autoMod from './autoMod'

// This is the array of events
const events: Event<any>[] = [
    ...interactionCreate,
    ...autoMod,
    ready,
]

export default events