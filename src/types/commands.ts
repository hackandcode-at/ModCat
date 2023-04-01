import { Awaitable, Client, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

// This is the type of the command props
type LoggerFunction = (...args: unknown[]) => void
export interface CommandProps {
    interaction: ChatInputCommandInteraction
    client: Client
    log: LoggerFunction
}

// This is the type of the command executors and metadata
export type CommandExec =
    (props: CommandProps) => Awaitable<unknown>
export type CommandMeta =
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
export interface Command {
    meta: CommandMeta
    exec: CommandExec
}

// This is the type of the command category extra
export interface CommandCategoryExtra {
    description?: string
    emoji?: string
}

// This is the type of the command category
export interface CommandCategory extends CommandCategoryExtra {
    name: string
    commands: Command[]
}