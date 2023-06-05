import { SlashCommandBuilder, EmbedBuilder, TextChannel } from 'discord.js';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { command, ChatGPTClient } from '../../utils'
import keys from '../../keys'

const meta = new SlashCommandBuilder()
    .setName('report')
    .setDescription('Melde einen Benutzer.')
    .addUserOption((option) => 
        option
            .setName('member')
            .setDescription('Benutzer, der gemeldet werden soll.')
            .setRequired(false)
    )
    .addStringOption((option) =>
        option
            .setName('reason')
            .setDescription('Grund der Meldung.')
            .setRequired(false)
    )
    
export default command(meta, async ({ interaction, client }) => {
    const member = interaction.options.getUser('member')
    const reason = interaction.options.getString('reason')

    const channel = interaction.channel as TextChannel

    const gpt = new ChatGPTClient()

    // Check if the user has provided a member
    if (!member) {
        return interaction.reply({
            ephemeral: true,
            content: 'Bitte gebe einen Benutzer an.',
        })
    }

    // Check if reason is set
    if (!reason) {
        return interaction.reply({
            ephemeral: true,
            content: 'Bitte gebe einen Grund an.',
        })
    }

    try {

        await interaction.deferReply()

        // Get 12 last messages (only the last 50 messages from mentioned user), sort by newest first
        const messages = (await channel.messages.fetch({ limit: 50 }))
            .filter((message) => message.author.id === member.id)
            .sort((a, b) => a.createdTimestamp - b.createdTimestamp)

        
            
        // Rules of the server
        const rules = [
            '§1.1 - Ein freundlicher Umgang ist sehr wichtig (keine Beleidigungen, respektvoller Umgang etc.)',
            '§1.2 - Das ständige Wiederholen von Nachrichten ist nicht erlaubt.',
            '§1.5 - Mobbing, Datenleaks, Drohungen oder Erpressung sind unter keinen Umständen erlaubt! Ein Verstoß führt zu einem permanenten Bann!',
            '§1.6 - Bilder und Links, die pornografische, rassistische, sexistische oder andere anstößige Inhalte darstellen sind nicht gestattet.',
            '§1.10 - Das unnötige pingen (ins Besondere) von @Admins, der @Moderation, dem @Support, @Creatorn, @VIPs und @Verifizierte ist unter allen Umständen zu unterlassen.',
            '§2.1 - Werbung ist auf dem gesamten Discord-Server nicht erlaubt.',
            '§2.3 - Das Teilen der eigenen Social-Media-Accounts wird hier nicht als Werbung angesehen, sofern dies kontextbezogen passiert. Das grundlose Teilen ist nicht gestattet - im Zweifel ein Teammitglied fragen.',
        ]



        // Messages for GPT
        const gptMessages = [
            {
                role: ChatCompletionRequestMessageRoleEnum.System,
                content: 'Du bist ein Moderator und musst einschätzen ob ein Regelbruch vorliegt.'
            },
            {
                role: ChatCompletionRequestMessageRoleEnum.User,
                content: `Wird in folgenden Nachrichten eine Regel gebrochen, oder ist es nur ein Missverständnis?\nDie begründung für die Meldung ist folgende:\n\n${reason}\n\nDie wichtigsten regeln sind folgende:\n${rules.map((rule) => `${rule}`).join('\n')}\n\nSollte keine Regel gebrochen worden sein, antworte mit "0".\nSollte eine Regel gebrochen sein dann begründe mit maximal 50 worten den Verstoß.\n\n\nDer Nachrichtenverlauf ist folgender: ${messages.map((message, index) => `${index}: "${message.content}";`).join('\n\n')}`
            },
        ]



        // Get response from GPT
        const result = await gpt.respond(gptMessages)
        let gptRes = <string|undefined>"0"
        
        if (result) {
            if (result.text !== "0") {
                gptRes = result.text
            }
        }

        if (gptRes === "0") {
            return interaction.editReply({
                content: 'Es konnte kein Regelbruch festgestellt werden (auf Grundlage der letzten 50 Nachrichten). Sollte es sich um einen Regelbruch handeln, melde dich bitte per Ticket bei einem Moderator.',
            })
        }



        // Create embed for the Audit Log Channel
        const modEmbed = new EmbedBuilder()
            .setTitle('Neue Meldung')
            .setDescription(`Der Benutzer ${member} wurde gemeldet.`)
            .addFields([
                {
                    name: 'Gemeldeter Benutzer',
                    value: `${member}`,
                    inline: true,
                },
                {
                    name: 'Gemeldet von',
                    value: `${interaction.user}`,
                    inline: true,
                },
                {
                    name: 'Channel',
                    value: `${channel}`,
                    inline: true,
                },
                {
                    name: 'Grund',
                    value: reason,
                    inline: false,
                },
                {
                    name: 'Erste einschätzung des Automoderators',
                    value: gptRes || 'Keine Einschätzung gefunden.',
                    inline: false,
                },
            ])
            .setColor(0xfa8231)
            .setTimestamp()

        // Send the embed to the Audit Log Channel
        const auditLogChannel = client.channels.cache.get(keys.auditChannel) as TextChannel
        if (auditLogChannel) {
            await auditLogChannel.send({
                content: `@here Ein neuer Benutzer wurde gemeldet.`,
                embeds: [modEmbed],
            })
        }      
        


        // Create embed for the user who used the command
        const replyEmbed = new EmbedBuilder()
            .setTitle('Meldung erfolgreich')
            .setDescription(`Der Benutzer ${member} wurde erfolgreich gemeldet. Ein Moderator wird sich um die Meldung kümmern, bitte habe etwas Geduld.`)
            .addFields([
                {
                    name: 'Grund',
                    value: reason,
                },
                {
                    name: 'Erste einschätzung des Automoderators',
                    value: gptRes || 'Keine Einschätzung gefunden.',
                },
            ])
            .setColor(0xfa8231)
            .setTimestamp()

        // Reply to the user who used the command
        return interaction.editReply({
            embeds: [replyEmbed],
        })

    } catch (error) {
        console.error(error);
        return interaction.reply({
            ephemeral: true,
            content: 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        });
    }
})
