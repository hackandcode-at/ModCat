import { EmbedBuilder, TextChannel, AuditLogEvent } from 'discord.js'
import keys from '../../keys'
import { event } from '../../utils'

// This is the ready event
export default event('guildMemberRemove', async ({ log }, member) => {

    // Get the audit log entry for the kick
    member.guild?.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 }).then(async audit => {
        const entry = audit.entries.first()
        if (entry) {
            
            // Check if the entry was created less than 5 seconds ago
            if (entry.createdTimestamp > Date.now() - 5000) {
                
                // Create a new embed for replying to the channel and auditing
                const audit = new EmbedBuilder()
                    .setTitle('Benutzer entbannt.')
                    .setDescription(`Der Benutzer **${member}** wurde erfolgreich entbannt`)
                    .addFields([
                        {
                            name: 'Moderator',
                            value: `${entry.executor}`,
                        },
                    ])
                    .setColor(0x26de81)
                    .setTimestamp()


                // Send the embed to the Audit Log Channel
                const logChannel = member.guild?.channels.cache.get(keys.auditChannel) as TextChannel
                if (logChannel) {
                    if (entry.executor?.id === '738046714283294731') return // Debug Bot
                    if (entry.executor?.id === '990596222102405140') return // Production Bot

                    await logChannel.send({
                        embeds: [audit],
                    })
                }
            }

        }
    })
})