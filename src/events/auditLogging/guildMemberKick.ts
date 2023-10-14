import { EmbedBuilder, TextChannel, AuditLogEvent, GuildAuditLogsEntry } from 'discord.js'
import keys from '../../keys'
import { event, db } from '../../utils'

// This is the ready event
export default event('guildMemberRemove', async ({ log }, member) => {

    // Add infractions to the database
    const addInfraction = (entry: GuildAuditLogsEntry) => {
        if (entry.executor?.id === '738046714283294731') return // Debug Bot
        if (entry.executor?.id === '990596222102405140') return // Production Bot

        // Generate a random number for the infraction id between 10000 and 99999
        const infractionId = Math.floor(Math.random() * (99999 - 10000 + 1) + 10000)

        // Insert the infraction into the database
        db.run(`
            INSERT INTO
                'infractions'
                (
                    id,
                    memberId,
                    moderatorId,
                    createdAt,
                    infractionType,
                    infractionReason
                )
            VALUES
                (
                    ${infractionId},
                    ${member.id},
                    ${entry.executor?.id},
                    ${Date.now()},
                    'kick',
                    '${entry.reason}'
                )
        `, (err) => {
            if (err) {
                console.error(err);
            }
        })
    }

    // Get the audit log entry for the kick
    member.guild?.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 }).then(async audit => {
        const entry = audit.entries.first()
        if (entry) {
            
            // Check if the entry was created less than 5 seconds ago
            if (entry.createdTimestamp > Date.now() - 5000) {

                addInfraction(entry)
                
                // Create a new embed for replying to the channel and auditing
                const audit = new EmbedBuilder()
                    .setTitle('Benutzer gekickt.')
                    .setDescription(`Der Benutzer **${member}** wurde erfolgreich gekickt.`)
                    .addFields([
                        {
                            name: 'Grund',
                            value: entry.reason || 'Kein Grund angegeben.',
                        },
                        {
                            name: 'Moderator',
                            value: `${entry.executor}`,
                        },
                    ])
                    .setColor(0xfa8231)
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