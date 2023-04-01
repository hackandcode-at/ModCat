import {
    Command,
    CommandCategory,
    CommandCategoryExtra,
    CommandExec,
    CommandMeta,
} from '../types'

// This is the function that creates a command
export function command(meta: CommandMeta, exec: CommandExec): Command {
    return { meta, exec }
}

// This is the function that registers the commands
export function category(name: string, commands: Command[], extra: CommandCategoryExtra = {}): CommandCategory {
    return {
        name,
        commands,
        ...extra,
    }
}