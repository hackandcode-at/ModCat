import { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, TextChannel } from 'discord.js';
import { command, db, infractionCheck } from '../../utils'
import keys from '../../keys'

const meta = new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Benutzer stummschalten (Voice-Chat).')
    .addUserOption((option) => 
        option
            .setName('member')
            .setDescription('Der zu stummschaltende Benutzer.')
            .setRequired(false)
    )
    .addStringOption((option) => 
        option
            .setName('reason')
            .setDescription('Grund des Stummschaltens.')
            .setRequired(false)
    )

export default command(meta, async ({ interaction, client }) => {
    const member = interaction.options.getUser('member')
    const reason = interaction.options.getString('reason')

    // Check if the user has the required permissions
    if (!(interaction.member?.permissions instanceof PermissionsBitField) || 
        !interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
        return interaction.reply({
            ephemeral: true,
            content: 'Du hast nicht die erforderlichen Berechtigungen, um Benutzer stummzuschalten.',
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
                content: 'Dieser Benutzer kann nicht stummgeschaltet werden.',
            })
        }


        // Check if the user is not in a voice channel
        if (!memberToMute.voice.channelId) {
            return interaction.reply({
                ephemeral: true,
                content: 'Dieser Benutzer ist nicht in einem Voice-Channel.',
            })
        }


        // Check if the user is already muted
        // if (memberToMute.voice.serverMute) {
        //     return interaction.reply({
        //         ephemeral: true,
        //         content: 'Dieser Benutzer ist bereits stummgeschaltet.',
        //     })
        // }


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
                    ${interaction.user.id},
                    ${Date.now()},
                    'mute',
                    '${reason}'
                )
        `, (err) => {
            if (err) {
                console.error(err);
                return interaction.reply({
                    ephemeral: true,
                    content: 'Es ist ein Fehler mit der Datenbank aufgetreten. Bitte versuche es später erneut.',
                })
            }
        })


        // Create a new embed for replying to the channel and auditing
        const audit = new EmbedBuilder()
            .setTitle('Benutzer stummgeschaltet.')
            .setDescription(`Der Benutzer **${member}** wurde erfolgreich stummgeschaltet.`)
            .addFields([
                {
                    name: 'Grund',
                    value: reason || 'Kein Grund angegeben.',
                },
                {
                    name: 'Moderator',
                    value: `${interaction.user}`,
                },
            ])
            .setColor(0xfa8231)
            .setTimestamp()


        // Create a new embed for sending to the user
        const embed = new EmbedBuilder()
            .setTitle('Du wurdest stummgeschaltet.')
            .setDescription(`Du wurdest auf dem **${interaction.guild?.name}** Discord stummgeschaltet (Voice-Chat).`)
            .addFields([
                {
                    name: 'Grund',
                    value: reason || 'Kein Grund angegeben.',
                },
                {
                    name: 'Moderator',
                    value: `${interaction.user}`,
                },
            ])
            .setColor(0xfa8231)
            .setTimestamp()

            
        // Infraction check
        await infractionCheck(member, interaction.user, interaction.guild || null, reason || 'Kein Grund angegeben.')
            .then(async (res) => {
                if (res) {
                    return interaction.reply({
                        embeds: [res],
                    })
                } else {

                    // try to send a dm to the user
                    try {
                        // Send a message to the user
                        await member.send({
                            embeds: [embed],
                        })
                    } catch (error) {
                        console.error(error);
                    }
            
            
                    // Mute the user
                    await memberToMute.voice.setMute(true, reason || 'Kein Grund angegeben.')
            
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
                }
            })
            .catch((err) => {
                console.error(err);
                return interaction.reply({
                    ephemeral: true,
                    content: 'Es ist ein Fehler mit der Datenbank aufgetreten. Bitte versuche es später erneut.',
                })
            })

    } catch (error) {
        console.error(error);
        return interaction.reply({
            ephemeral: true,
            content: 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        });
    }
})
