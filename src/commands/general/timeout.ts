import { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, TextChannel } from 'discord.js';
import { command, db } from '../../utils'
import keys from '../../keys'

const meta = new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Benutzer timeouten.')
    .addUserOption((option) => 
        option
            .setName('member')
            .setDescription('Der zu timeoutende Benutzer.')
            .setRequired(false)
    )
    .addNumberOption((option) =>
        option
            .setName('duration')
            .setDescription('Dauer des Timeouts in Minuten')
            .setMinValue(1)
            .setMaxValue(20160)
            .setRequired(false)
    )
    .addStringOption((option) => 
        option
            .setName('reason')
            .setDescription('Grund des Timeouts')
            .setRequired(false)
    )

export default command(meta, async ({ interaction, client }) => {
    const member = interaction.options.getUser('member')
    let reason = interaction.options.getString('reason')
    const duration = interaction.options.getNumber('duration')

    // Check if the user has the permission to timeout members
    if (!(interaction.member?.permissions instanceof PermissionsBitField) || 
        !interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return interaction.reply({
            ephemeral: true,
            content: 'Du hast nicht die erforderlichen Berechtigungen, um Benutzer zu timeouten.',
        });
    }

    // Check if the user has provided a member
    if (!member) {
        return interaction.reply({
            ephemeral: true,
            content: 'Bitte gebe einen Benutzer an.',
        })
    }

    // Check if the user has provided a duration
    if (!duration) {
        return interaction.reply({
            ephemeral: true,
            content: 'Bitte gebe eine Dauer an.',
        })
    }

    try {

        // Check if the user is timeoutable
        const memberToTimeout = await interaction.guild?.members.fetch(member.id)
        if (!memberToTimeout?.moderatable) {
            return interaction.reply({
                ephemeral: true,
                content: 'Dieser Benutzer kann nicht getimeoutet werden.',
            })
        }

        // If reason is set add duration to reason
        if (reason) {
            reason = `${reason} (${duration} Minuten)`
        }


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
                    infractionReason,
                    infractionValue
                )
            VALUES
                (
                    ${infractionId},
                    ${member.id},
                    ${interaction.user.id},
                    ${Date.now()},
                    'timeout',
                    '${reason}',
                    ${duration}
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
            .setTitle('Benutzer getimeoutet.')
            .setDescription(`Der Benutzer **${member}** wurde erfolgreich getimeoutet.`)
            .addFields([
                {
                    name: 'Dauer',
                    value: `${duration} Minuten`,
                },
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
            .setTitle('Du wurdest getimeoutet.')
            .setDescription(`Du wurdest auf dem **${interaction.guild?.name}** Discord getimeoutet.`)
            .addFields([
                {
                    name: 'Dauer',
                    value: `${duration} Minuten`,
                },
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


        // try to send a dm to the user
        try {
            // Send a message to the user
            await member.send({
                embeds: [embed],
            })
        } catch (error) {
            console.error(error);
        }


        // timeout the user
        await memberToTimeout.timeout( duration * 60 * 1000, reason || 'Kein Grund angegeben.' )


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
