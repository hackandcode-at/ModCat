import { SlashCommandBuilder, EmbedBuilder, TextChannel } from 'discord.js';
import { command, db } from '../../utils'
import keys from '../../keys'

const meta = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Zeigt dir Moderationsstatistiken an. Global oder Moderatorspezifisch.')
    .addUserOption((option) => 
        option
            .setName('moderator')
            .setDescription('Moderator, dessen Statistiken angezeigt werden sollen. (Optional - Standard: Global)')
            .setRequired(false)
    )

export default command(meta, async ({ interaction, client }) => {
    const member = interaction.options.getUser('moderator')

    try {
        
        if (!member) {

            const allInfractions = await getDbCounts()
            const allWarns = await getDbCounts('warn')
            const allTimeouts = await getDbCounts('timeout')
            const allBans = await getDbCounts('ban')
            const allKicks = await getDbCounts('kick')
            const allMutes = await getDbCounts('mute')

            const embed = new EmbedBuilder()
                .setTitle('Moderationsstatistiken')
                .setDescription(`Hier sind die Moderationsstatistiken des Servers.`)
                .addFields([
                    {
                        name: 'Insgesamt',
                        value: `${allInfractions}`,
                        inline: true,
                    },
                    {
                        name: 'Verwarnungen',
                        value: `${allWarns}`,
                        inline: true,
                    },
                    {
                        name: 'Timeouts (TC)',
                        value: `${allTimeouts}`,
                        inline: true,
                    },
                    {
                        name: 'Bans',
                        value: `${allBans}`,
                        inline: true,
                    },
                    {
                        name: 'Kicks',
                        value: `${allKicks}`,
                        inline: true,
                    },
                    {
                        name: 'Mutes (VC)',
                        value: `${allMutes}`,
                        inline: true,
                    },
                ])
                .setColor(0xFEC200)

            return interaction.reply({
                embeds: [embed],
            })

        } else {

            const allInfractions = await getDbCounts(undefined, member.id) as number
            const allWarns = await getDbCounts('warn', member.id) as number
            const allTimeouts = await getDbCounts('timeout', member.id) as number
            const allBans = await getDbCounts('ban', member.id) as number
            const allKicks = await getDbCounts('kick', member.id) as number
            const allMutes = await getDbCounts('mute', member.id) as number

            const embed = new EmbedBuilder()
                .setTitle('Moderationsstatistiken')
                .setDescription(`Hier sind die Moderationsstatistiken des Moderators ${member}.`)
                .addFields([
                    {
                        name: 'Insgesamt',
                        value: `${allInfractions}`,
                        inline: true,
                    },
                    {
                        name: 'Verwarnungen',
                        value: `${allWarns}`,
                        inline: true,
                    },
                    {
                        name: 'Timeouts (TC)',
                        value: `${allTimeouts}`,
                        inline: true,
                    },
                    {
                        name: 'Bans',
                        value: `${allBans}`,
                        inline: true,
                    },
                    {
                        name: 'Kicks',
                        value: `${allKicks}`,
                        inline: true,
                    },
                    {
                        name: 'Mutes (VC)',
                        value: `${allMutes}`,
                        inline: true,
                    }
                ])
                .setColor(0xFEC200)

            return interaction.reply({
                embeds: [embed],
            })

        }

    } catch (error) {
        console.error(error);
        return interaction.reply({
            ephemeral: true,
            content: 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        });
    }
})

const getDbCounts = async (type?: string, moderator?: string) => {
    let query = `SELECT COUNT(*) AS count FROM infractions`
    if (type && moderator) {
        query += ` WHERE infractionType = '${type}' AND moderatorId = '${moderator}'`
    } else if (type) {
        query += ` WHERE infractionType = '${type}'`
    } else if (moderator) {
        query += ` WHERE moderatorId = '${moderator}'`
    }

    return new Promise((resolve, reject) => {
        db.get(query, [], (err, row: any) => {
            if (err) reject(err)
            resolve(row.count)
        })
    })
}