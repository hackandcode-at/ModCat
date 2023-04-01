import { Event, EventKeys, EventExec } from '../types'
import { Client } from 'discord.js'

// This is the function that creates an event
export function event<T extends EventKeys>(id: T, exec: EventExec<T>): Event<T> {
    return { id, exec }
}

// This is the function that registers the events
export function registerEvents(client: Client, events: Event<any>[]): void {
    for (const event of events) {
        client.on(event.id, async (...args) => {

            // Create props
            const props = {
                client,
                log: (...args: unknown[]) =>
                    console.log(`[${event.id}]`, ...args),
            }

            // Catch uncaught errors
            try {
                await event.exec(props, ...args)
            } catch (error) {
                props.log('Uncaught Error', error)
            }
        })
    }
}