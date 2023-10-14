import { EmbedBuilder, TextChannel, AuditLogEvent } from 'discord.js'
import keys from '../../keys'
import { event } from '../../utils'

// This is the ready event
export default event('messageDelete', async ({ log }, message) => {

    let content = '*Nachricht konnte nicht geladen werden*'
    if (message.partial) {
        const msg = await message.fetch()
        content = msg.content
    }

    let deletedBy = message.author
    
    message.guild?.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 1 }).then(audit => {
        const entry = audit.entries.first()
        if (entry) {
            
            // Check if the entry was created less than 5 seconds ago
            if (entry.createdTimestamp > Date.now() - 5000) {
                
                deletedBy = entry.executor
            }

        }
    })

    // Create the embed
    const embed = new EmbedBuilder()
        .setDescription(`**Nachricht von ${message.author} in ${message.channel} gelöscht**`)
        .addFields([
            {
                name: 'Inhalt',
                value: content,
            },
            {
                name: 'Gelöscht von',
                value: `${deletedBy}`,
            }
        ])
        .setFooter(
            {
                text: `Nachricht ID: ${message.id}`,
            }
        )
        .setColor(0xeb3b5a)
        .setTimestamp()


    // Send the embed to the Audit Log Channel
    const logChannel = message.guild?.channels.cache.get(keys.logChannel) as TextChannel
    if (logChannel) {
        await logChannel.send({
            embeds: [embed],
        })
    }
})