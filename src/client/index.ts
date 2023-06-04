import { Client, GatewayIntentBits } from 'discord.js'
import { registerEvents } from '../utils'
import events from '../events'
import keys from '../keys'

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessages,
    ],
})

// Register the events
registerEvents(client, events)

// Login to Discord with your client's token
client.login(keys.clientToken)
    .catch((err) => {
        console.error('[Login Error]', err)
        process.exit(1)
    })