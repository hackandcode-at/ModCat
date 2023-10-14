import { Event } from '../../types'
import deleteMessage from './deleteMessage'
import guildMemberBan from './guildMemberBan'
import guildMemberUnban from './guildMemberUnban'
import guildMemberKick from './guildMemberKick'

// This is the array of events
const events: Event<any>[] = [
    //deleteMessage,
    guildMemberBan,
    guildMemberUnban,
    guildMemberKick,
]

export default events