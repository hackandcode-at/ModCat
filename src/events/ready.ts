import { event } from '../utils'

// This is the ready event
export default event('ready', ({ log }, client) => {
    log(`Logged in as ${client.user?.tag}`)
})