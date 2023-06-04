import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { command, db } from '../../utils'

const meta = new SlashCommandBuilder()
    .setName('infractions')
    .setDescription('Eine Liste mit allen Maßnahmen gegen einen Benutzer anzeigen.')
    .addUserOption((option) =>
        option
            .setName('member')
            .setDescription('Benutzer, dessen Maßnahmen angezeigt werden sollen.')
            .setRequired(false)
    )

export default command(meta, async ({ interaction }) => {
    const member = interaction.options.getUser('member')

    // Check if the user has provided a member
    if (!member) {
        return interaction.reply({
            ephemeral: true,
            content: 'Bitte gebe einen Benutzer an.',
        })
    }

    // Check if the command user has the permission to view infractions
    if (!(interaction.member?.permissions instanceof PermissionsBitField) ||
        !interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return interaction.reply({
            ephemeral: true,
            content: 'Du hast nicht die erforderlichen Berechtigungen, um Maßnahmen anzuzeigen.',
        });
    }

    // Get all infractions from the database
    db.all(`SELECT * FROM infractions WHERE memberId = ${member.id} ORDER BY createdAt DESC`, [], (err, rows: any) => {
        if (err) {
            console.error(err);
            return interaction.reply({
                ephemeral: true,
                content: 'Es ist ein Fehler mit der Datenbank aufgetreten. Bitte versuche es später erneut.',
            })
        }

        const embed = new EmbedBuilder()

        // Check if the user has any infractions
        if (rows.length === 0) {
            embed
                .setTitle(`Maßnahmen - ${member.username}`)
                .setDescription(`${member} hat keine Maßnahmen erhalten.`)
                .setColor(0x26de81)
        }
        
        else {
            // Count last 24 hours and last 7 days infractions (createdAt is a timestamp)
            const last24Hours = rows.filter((row: any) => row.createdAt > Date.now() - 86400000).length
            const last7Days = rows.filter((row: any) => row.createdAt > Date.now() - 604800000).length

            // Get 10 newest infractions
            rows = rows.slice(0, 10)

            const last10Infractions = rows.map((row: any) => {
                // Infraction type first letter to uppercase
                const infractionType = row.infractionType.charAt(0).toUpperCase() + row.infractionType.slice(1)

                // moderatorId to GuildMember
                const moderator = interaction.guild?.members.cache.get(row.moderatorId)

                // Convert timestamp to date
                const date = new Date(Number(row.createdAt))
                const formattedDate = date.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                return `**${infractionType}** am **${formattedDate}** mit der ID **${row.id}**: \n *${row.infractionReason}* ~ ${moderator}`
            }).join('\n \n')

            // Member to GuildMember
            const gMember = interaction.guild?.members.cache.get(member.id)

            embed
                .setTitle(`Maßnahmen - ${member.username}`)
                .setDescription(`Maßnahmen - ${gMember}`)
                .addFields([
                    {
                        name: 'Letzten 24 Stunden',
                        value: `${last24Hours}`,
                        inline: true,
                    },
                    {
                        name: 'Letzten 7 Tage',
                        value: `${last7Days}`,
                        inline: true,
                    },
                    {
                        name: 'Insgesamt',
                        value: `${rows.length}`,
                        inline: true,
                    },
                    {
                        name: 'Letzte 10 Maßnahmen',
                        value: last10Infractions
                    }
                ])
                .setColor(0xfa8231)
        }
        

        interaction.reply({
            embeds: [embed],
        })
    })
})
