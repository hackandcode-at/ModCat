import { SlashCommandBuilder, EmbedBuilder, TextChannel } from 'discord.js';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { command, ChatGPTClient } from '../../utils'
import keys from '../../keys'

const meta = new SlashCommandBuilder()
    .setName('summary')
    .setDescription('Fasse eine Unterhaltung zusammen.')
    .addNumberOption((option) => 
        option
            .setName('count')
            .setDescription('Anzahl der Nachrichten, die zusammengefasst werden sollen.')
            .setRequired(false)
    )
    
export default command(meta, async ({ interaction, client }) => {
    const count = interaction.options.getNumber('count')

    const channel = interaction.channel as TextChannel

    const gpt = new ChatGPTClient()

    // Check if count is set
    if (!count) {
        return interaction.reply({
            ephemeral: true,
            content: 'Bitte gebe eine Anzahl an.',
        })
    }

    try {

        await interaction.deferReply()

        // Get the last (count) messages
        const messages = (await channel.messages.fetch({ limit: count }))
            .sort((a, b) => a.createdTimestamp - b.createdTimestamp)

        // Messages for GPT
        const gptMessages = [
            {
                role: ChatCompletionRequestMessageRoleEnum.System,
                content: 'Fasse die Unterhaltung zusammen. Du bist dabei der Benutzer ModCat, bitte ignoriere alle Nachrichten von dir selbst, und fasse nur die Nachrichten der anderen Benutzer zusammen.'
            },
            {
                role: ChatCompletionRequestMessageRoleEnum.User,
                content: `Fasse die Unterhaltung mit maximal 320 Wörtern zusammen. In dieser Zusammenfassung sollte grob erläutert werden um was es bei der Unterhaltung geht, und wer welchen Standpunkt hat. Die Unterhaltung:\n\n${messages.map((message) => `${message.author.username}: "${message.content}";`).join('\n\n')}`
            },
        ]

        // Get response from GPT
        const result = await gpt.respond(gptMessages)

        // Reply to the user who used the command
        return interaction.editReply({
            content: result?.text ?? 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        })

    } catch (error) {
        console.error(error);
        return interaction.reply({
            ephemeral: true,
            content: 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        });
    }
})
