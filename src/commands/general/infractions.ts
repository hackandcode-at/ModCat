import { SlashCommandBuilder } from 'discord.js';
import { command } from '../../utils'

const meta = new SlashCommandBuilder()
    .setName('infractions')
    .setDescription('Eine Liste mit allen Maßnahmen gegen einen Benutzer anzeigen.')
    .addUserOption((option) =>
        option
            .setName('member')
            .setDescription('Benutzer, dessen Maßnahmen angezeigt werden sollen.')
            .setRequired(false)
    )

export default command(meta, ({ interaction }) => {
    const member = interaction.options.getUser('member')

    // Check if the user has provided a member
    if (!member) {
        return interaction.reply({
            ephemeral: true,
            content: 'Bitte gebe einen Benutzer an.',
        })
    }

    

})
