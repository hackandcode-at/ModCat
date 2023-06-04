import { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, TextChannel } from 'discord.js';
import { command, db } from '../../utils'
import keys from '../../keys'

const meta = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Benutzer bannen.')
    .addUserOption((option) => 
        option
            .setName('member')
            .setDescription('Der zu bannende Benutzer.')
            .setRequired(false)
    )
    .addStringOption((option) => 
        option
            .setName('reason')
            .setDescription('Grund des Bannes.')
            .setRequired(false)
    )
    .addNumberOption((option) =>
        option
            .setName('days')
            .setDescription('Anzahl der Tage der zu löschenden Nachrichten, muss zwischen 0 und 7 liegen.')
            .setMinValue(0)
            .setMaxValue(7)
            .setRequired(false)
    )

export default command(meta, async ({ interaction, client }) => {
    const member = interaction.options.getUser('member')
    const reason = interaction.options.getString('reason')
    const days = interaction.options.getNumber('days')

    if (!(interaction.member?.permissions instanceof PermissionsBitField) || 
        !interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return interaction.reply({
            ephemeral: true,
            content: 'Du hast nicht die erforderlichen Berechtigungen, um Benutzer zu bannen.',
        });
    }

    if (!member) {
        return interaction.reply({
            ephemeral: true,
            content: 'Bitte gebe einen Benutzer an.',
        })
    }

    try {

        // Check if the user is bannable
        const memberToBan = await interaction.guild?.members.fetch(member.id)
        if (!memberToBan?.bannable) {
            return interaction.reply({
                ephemeral: true,
                content: 'Dieser Benutzer kann nicht gebannt werden.',
            })
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
                    infractionReason
                )
            VALUES
                (
                    ${infractionId},
                    ${member.id},
                    ${interaction.user.id},
                    ${Date.now()},
                    'ban',
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
            .setTitle('Benutzer gebannt.')
            .setDescription(`Der Benutzer **${member}** wurde erfolgreich gebannt.`)
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
            .setColor(0xeb3b5a)
            .setTimestamp()


        // Create a new embed for sending to the user
        const embed = new EmbedBuilder()
            .setTitle('Du wurdest gebannt.')
            .setDescription(`Du wurdest vom **${interaction.guild?.name}** Discord gebannt.`)
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
            .setColor(0xeb3b5a)
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


        // Ban the user
        await memberToBan.ban({ deleteMessageDays: days || 0, reason: reason || 'Kein Grund angegeben.' })


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
