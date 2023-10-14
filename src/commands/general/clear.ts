import { SlashCommandBuilder, PermissionsBitField, TextChannel } from 'discord.js';
import { command } from '../../utils'
import keys from '../../keys'

const meta = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Entfernt eine bestimmte Anzahl an Nachrichten aus dem Chat.')
    .addNumberOption((option) =>
        option
            .setName('count')
            .setDescription('Anzahl der zu löschenden Nachrichten.')
            .setMinValue(1)
            .setRequired(false)
    )
    .addMentionableOption((option) =>
        option
            .setName('member')
            .setDescription('Benutzer, dessen Nachrichten gelöscht werden sollen.')
            .setRequired(false)
    )

export default command(meta, async ({ interaction, client }) => {
    const count = interaction.options.getNumber('count')
    const member = interaction.options.getUser('member')
    
    // Check if the user has the permission to delete messages
    if (!(interaction.member?.permissions instanceof PermissionsBitField) || 
        !interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return interaction.reply({
            ephemeral: true,
            content: 'Du hast nicht die erforderlichen Berechtigungen, um Nachrichten zu löschen.',
        });
    }

    // Check if count is set
    if (!count) {
        return interaction.reply({
            ephemeral: true,
            content: 'Bitte gebe eine Anzahl an Nachrichten an.',
        })
    }

    const channel = interaction.channel as TextChannel

    try {

        let messages = null

        if (member) {
            messages = await channel.messages.fetch({ limit: count })
            messages = messages.filter((message) => message.author.id === member.id)
        } else {
            messages = await channel.messages.fetch({ limit: count })
        }

        await channel.bulkDelete(messages);
        interaction.reply({
            ephemeral: true,
            content: `Ich habe erfolgreich ${count} Nachrichten${member ? ` von ${member}` : ''} gelöscht!`,
        });

    } catch (error) {

        console.error(error)
        interaction.reply({
            ephemeral: true,
            content: 'Es ist ein Fehler beim Löschen der Nachrichten aufgetreten.',
        });

    }

})
