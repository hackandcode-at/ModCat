import { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, TextChannel } from 'discord.js';
import { command } from '../../utils'
import keys from '../../keys'

const meta = new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Benutzer stummschalten aufheben (Voice-Chat).')
    .addUserOption((option) => 
        option
            .setName('member')
            .setDescription('Der gestummte Benutzer.')
            .setRequired(false)
    )

export default command(meta, async ({ interaction, client }) => {
    const member = interaction.options.getUser('member')

    // Check if the user has the required permissions
    if (!(interaction.member?.permissions instanceof PermissionsBitField) || 
        !interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
        return interaction.reply({
            ephemeral: true,
            content: 'Du hast nicht die erforderlichen Berechtigungen, um Benutzer zu entstummen.',
        });
    }

    // Check if the user has provided a member
    if (!member) {
        return interaction.reply({
            ephemeral: true,
            content: 'Bitte gebe einen Benutzer an.',
        })
    }

    try {

        // Check if the user is muteable
        const memberToMute = await interaction.guild?.members.fetch(member.id)
        if (!memberToMute?.moderatable) {
            return interaction.reply({
                ephemeral: true,
                content: 'Dieser Benutzer kann nicht entstummt werden.',
            })
        }


        // Check if the user is not in a voice channel
        if (!memberToMute.voice.channelId) {
            return interaction.reply({
                ephemeral: true,
                content: 'Dieser Benutzer ist nicht in einem Voice-Channel.',
            })
        }


        // Check if the user is not muted
        // if (!memberToMute.voice.serverMute) {
        //     return interaction.reply({
        //         ephemeral: true,
        //         content: 'Dieser Benutzer ist nicht stummgeschaltet.',
        //     })
        // }

        // Create a new embed for replying to the channel and auditing
        const audit = new EmbedBuilder()
            .setTitle('Benutzer entstummt.')
            .setDescription(`Der Benutzer **${member}** wurde erfolgreich entstummt.`)
            .addFields([
                {
                    name: 'Moderator',
                    value: `${interaction.user}`,
                },
            ])
            .setColor(0x26de81)
            .setTimestamp()


        // Create a new embed for sending to the user
        const embed = new EmbedBuilder()
            .setTitle('Du wurdest entstummt.')
            .setDescription(`Du wurdest auf dem **${interaction.guild?.name}** Discord entstummt (Voice-Chat).`)
            .addFields([
                {
                    name: 'Moderator',
                    value: `${interaction.user}`,
                },
            ])
            .setColor(0x26de81)
            .setTimestamp()


        // try to send a dm to the user
        try {
            // Send a message to the user
            await member.send({
                embeds: [embed],
            })
        } catch (error) {
            console.error(error);
        }


        // Unmute the user
        await memberToMute.voice.setMute(false)

        // Send the embed to the Audit Log Channel
        const auditLogChannel = client.channels.cache.get(keys.auditChannel) as TextChannel
        if (auditLogChannel) {
            await auditLogChannel.send({
                embeds: [audit],
            })
        }


        // Send the embed to the channel
        return interaction.reply({
            embeds: [audit],
        })

    } catch (error) {
        console.error(error);
        return interaction.reply({
            ephemeral: true,
            content: 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        });
    }
})
