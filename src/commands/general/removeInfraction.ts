import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { command, db } from '../../utils'

const meta = new SlashCommandBuilder()
    .setName('infraction-remove')
    .setDescription('Eine Maßnahme entfernen.')
    .addNumberOption((option) =>
        option
            .setName('id')
            .setDescription('ID der Maßnahme, die entfernt werden soll.')
            .setRequired(false)
    )

export default command(meta, async ({ interaction }) => {
    const id = interaction.options.getNumber('id');

    // Check if id is set
    if (!id) {
        return interaction.reply({
            ephemeral: true,
            content: 'Du musst eine ID angeben.',
        });
    }
    
    // Check if the command user has the permission to delete infractions
    if (!(interaction.member?.permissions instanceof PermissionsBitField) ||
        !interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return interaction.reply({
            ephemeral: true,
            content: 'Du hast nicht die erforderlichen Berechtigungen, um Maßnahmen anzuzeigen.',
        });
    }

    // Search for the infraction
    db.all(`SELECT * FROM infractions WHERE id = ${id} LIMIT 1`, [], (err, rows: any) => {
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
                content: 'Es wurde keine Maßnahme mit dieser ID gefunden.',
            })
        }

        // Delete the infraction
        db.run(`DELETE FROM infractions WHERE id = ${id}`, [], (err) => {
            if (err) {
                console.error(err);
                return interaction.reply({
                    ephemeral: true,
                    content: 'Es ist ein Fehler mit der Datenbank aufgetreten. Bitte versuche es später erneut.',
                })
            }

            // Create the embed
            const embed = new EmbedBuilder()
                .setTitle('Maßnahme entfernt')
                .setDescription(`Die Maßnahme mit der ID **${id}** wurde entfernt.`)
                .setColor(0x26de81)
                .setTimestamp()

            return interaction.reply({
                embeds: [embed],
            })
        })
    })
})
