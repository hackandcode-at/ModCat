import { ActivityType } from 'discord.js'
import { event } from '../utils'

// This is the ready event
export default event('ready', ({ log }, client) => {
    
    // Set the bot's activity
    client.user?.setActivity('/info', { type: ActivityType.Playing })

    // Log that the bot is ready
    log(`Logged in as ${client.user?.tag}`)
})