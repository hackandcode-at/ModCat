import { EmbedBuilder, Message, TextChannel, PermissionsBitField } from 'discord.js'
import { event, db } from '../utils'
import keys from '../keys';

// Create a map to store user cooldowns and spam count
const cooldowns = new Map<string, { expiration: number; spamCount: number; spamDetectedCooldown: number }>();

// Set the cooldown durations in seconds
const messageCooldownDuration = 4;
const spamDetectedCooldownDuration = 10;

// Minimum number of detected spams required
const minSpamCount = 3;


// This is the message event
export default event('messageCreate', ({ log }, message) => {
    // Check if the message is from a bot
    if (message.author.bot) return;

    // Check if the message is from a moderator
    if (message.member?.permissions instanceof PermissionsBitField && message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;

    // Get the author's ID
    const authorID = message.author.id;

    // Check if the author is on cooldown
    if (cooldowns.has(authorID)) {
        const { expiration, spamCount, spamDetectedCooldown } = cooldowns.get(authorID)!;
        const remainingTime = expiration - Date.now();

        // Spam detected
        if (remainingTime > 0) {
        // Increment the spam count
        cooldowns.set(authorID, { expiration, spamCount: spamCount + 1, spamDetectedCooldown });

        // Check if minimum spam count is reached and spamDetectedCooldown has expired
        if (spamCount >= minSpamCount && spamDetectedCooldown <= 0) {
            detectedSpam(message);

            // Set the spamDetectedCooldown
            cooldowns.get(authorID)!.spamDetectedCooldown = spamDetectedCooldownDuration;
        }
        } else {
        // Reset the cooldown if it has expired
        cooldowns.set(authorID, {
            expiration: Date.now() + messageCooldownDuration * 1000,
            spamCount: 1,
            spamDetectedCooldown: 0
        });
        }

        // Decrease the spamDetectedCooldown if it is active
        if (spamDetectedCooldown > 0) {
        cooldowns.get(authorID)!.spamDetectedCooldown -= 1;
        }
    } else {
        // Set the author on cooldown with initial spam count
        cooldowns.set(authorID, {
        expiration: Date.now() + messageCooldownDuration * 1000,
        spamCount: 1,
        spamDetectedCooldown: 0
        });
    }
});


// This function is called when spam is detected
const detectedSpam = async (message: Message) => {
    
    // Generate a random number for the infraction id between 10000 and 99999
    const infractionId = Math.floor(Math.random() * (99999 - 10000 + 1) + 10000)

    // Get bot's id
    const bot = message.client.user

    // Reason for the infraction
    const reason = 'Spammt in ' + message.channel.toString() + ' rum! Es wird ein Timeout von 90 Sekunden verhängt.'

    // Add the infraction to the database
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
                    ${message.author.id},
                    ${bot.id},
                    ${Date.now()},
                    'warn',
                    '${reason}'
                )
    `, (err) => {
        if (err) {
            return console.error(err);
        }
    })

    // Timeout the user for 90 seconds
    await message.member?.timeout( 90 * 1000, reason )

    // Create a new embed for replying to the channel and auditing
    const audit = new EmbedBuilder()
    .setTitle('Benutzer verwarnt')
    .setDescription(`Der Benutzer **${message.author}** wurde erfolgreich verwarnt.`)
    .addFields([
        {
            name: 'Grund',
            value: reason || 'Kein Grund angegeben.',
        },
        {
            name: 'Moderator',
            value: `${bot}`,
        },
    ])
    .setColor(0xfa8231)
    .setTimestamp()


    // Create a new embed for sending to the user
    const embed = new EmbedBuilder()
        .setTitle('Du wurdest verwarnt.')
        .setDescription(`Du wurdest auf dem **${ message.guild?.name }** Discord verwarnt.`)
        .addFields([
            {
                name: 'Grund',
                value: reason || 'Kein Grund angegeben.',
            },
            {
                name: 'Moderator',
                value: `${bot}`,
            },
        ])
        .setColor(0xfa8231)
        .setTimestamp()

    // try to send a dm to the user
    try {
        // Send a message to the user
        await message.author.send({
            embeds: [embed],
        })
    } catch (error) {
        console.error(error);
    }


    // Send the embed to the Audit Log Channel
    // const auditLogChannel = client.channels.cache.get(keys.auditChannel) as TextChannel
    const auditLogChannel = message.guild?.channels.cache.get(keys.auditChannel) as TextChannel
    if (auditLogChannel) {
        await auditLogChannel.send({
            embeds: [audit],
        })
    }


    // Send the embed to the channel
    return await message.channel.send({
        embeds: [audit],
    })
}