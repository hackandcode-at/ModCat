import { EmbedBuilder, Guild, TextChannel, User } from "discord.js";
import { db } from "./database";
import keys from "../keys";

export const infractionCheck = (member: User, mod: User, guild: Guild|null, reason: string) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM infractions WHERE memberId = ${member.id} ORDER BY createdAt DESC`, [], async (err, rows: any) => {
            if (err) {
                console.error(err);
                resolve(false)
            }

            if (rows.length === 0) {
                resolve(false)
            }

            // Count last 24 hours and last 7 days infractions (createdAt is a timestamp)
            const last24Hours = rows.filter((row: any) => row.createdAt > Date.now() - 86400000).length
            const last7Days = rows.filter((row: any) => row.createdAt > Date.now() - 604800000).length

            // Check if the user has more than 3 infractions in the last 24 hours or more than 5 in the last 7 days
            if (last24Hours > 3 || last7Days > 5) {
                
                // Generate a random number for the infraction id between 10000 and 99999
                const infractionId = Math.floor(Math.random() * (99999 - 10000 + 1) + 10000)

                reason = `Automatischer Ban wegen zu vieler Maßnahmen. (Ursprünglicher Grund: ${reason})`

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
                            ${mod.id},
                            ${Date.now()},
                            'ban',
                            '${reason}'
                        )
                `, (err) => {
                    if (err) {
                        console.error(err);
                    }
                })

                // Create a new embed for sending to the user
                const embed = new EmbedBuilder()
                    .setTitle('Du wurdest gebannt.')
                    .setDescription(`Du wurdest vom **${guild?.name}** Discord gebannt.`)
                    .addFields([
                        {
                            name: 'Grund',
                            value: reason || 'Kein Grund angegeben.',
                        },
                        {
                            name: 'Moderator',
                            value: `${mod}`,
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
                            value: `${mod}`,
                        },
                    ])
                    .setColor(0xeb3b5a)
                    .setTimestamp()
                
                // Ban the user
                const memberToBan = await guild?.members.fetch(member.id)
                await memberToBan?.ban({ reason: reason })

                // Send the embed to the Audit Log Channel
                const auditLogChannel = guild?.channels.cache.get(keys.auditChannel) as TextChannel
                if (auditLogChannel) {
                    await auditLogChannel.send({
                        embeds: [audit],
                    })
                }
            
                // Resolve the promise with the audit embed
                resolve(audit)
            } else {
                resolve(false)
            }
        })
    })
}