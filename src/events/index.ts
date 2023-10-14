import { Event } from '../types'
import ready from './ready'
import interactionCreate from './interactionCreate'
import auditLogging from './auditLogging'
import autoMod from './autoMod'

// This is the array of events
const events: Event<any>[] = [
    ...interactionCreate,
    ...auditLogging,
    ...autoMod,
    ready,
]

export default events