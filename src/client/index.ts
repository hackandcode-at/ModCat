import { Client, GatewayIntentBits } from 'discord.js'
import sqlite3 from 'sqlite3'
import path from 'path'
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

// Database path
const dbPath = path.resolve(__dirname, 'modcat.db.sqlite');

// Create a new database instance
export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[Database Error]', err)
        process.exit(1)
    } else {
        console.log('[Database]', 'Connected to database.')
    }
})

// Register the events
registerEvents(client, events)

// Login to Discord with your client's token
client.login(keys.clientToken)
    .catch((err) => {
        console.error('[Login Error]', err)
        process.exit(1)
    })

process.on('exit', () => {
    db.close((err) => {
        if (err) {
            console.error('[Database Error]', err)
        } else {
            console.log('[Database]', 'Disconnected from database.')
        }
    })
})