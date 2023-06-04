import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { command, db } from '../../utils'

const meta = new SlashCommandBuilder()
    .setName('infraction-remove-all')
    .setDescription('Entfernt alle Maßnahmen eines Nutzers.')
    .addUserOption((option) =>
        option
            .setName('member')
            .setDescription('Benutzer, dessen Maßnahmen entfernt werden sollen.')
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

    // Check if the command user has the permission to delete infractions
    if (!(interaction.member?.permissions instanceof PermissionsBitField) ||
        !interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return interaction.reply({
            ephemeral: true,
            content: 'Du hast nicht die erforderlichen Berechtigungen, um Maßnahmen anzuzeigen.',
        });
    }

    // Search for the infractions
    db.all(`SELECT * FROM infractions WHERE memberId = ${member.id} ORDER BY createdAt DESC`, [], (err, rows: any) => {
        if (err) {
            console.error(err);
            return interaction.reply({
                ephemeral: true,
                content: 'Es ist ein Fehler mit der Datenbank aufgetreten. Bitte versuche es später erneut.',
            })
        }

        // Check if the infraction exists
        if (rows.length === 0) {
            return interaction.reply({
                ephemeral: true,
                content: 'Dieser Benutzer hat keine Maßnahmen.',
            })
        }

        // Delete all infractions
        db.run(`DELETE FROM infractions WHERE memberId = ${member.id}`, [], (err) => {
            if (err) {
                console.error(err);
                return interaction.reply({
                    ephemeral: true,
                    content: 'Es ist ein Fehler mit der Datenbank aufgetreten. Bitte versuche es später erneut.',
                })
            }

            // Create the embed
            const embed = new EmbedBuilder()
                .setTitle('Maßnahmen entfernt')
                .setDescription(`Alle Maßnahmen von ${member} wurden entfernt.`)
                .setColor(0x26de81)
                .setTimestamp()

            return interaction.reply({
                embeds: [embed],
            })
        })
    })
})
