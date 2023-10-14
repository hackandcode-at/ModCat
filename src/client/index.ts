import { Client, Partials, GatewayIntentBits } from 'discord.js'
import { registerEvents } from '../utils'
import events from '../events'
import keys from '../keys'

// Create a new client instance
const client = new Client({
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
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