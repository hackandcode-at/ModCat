import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { command } from '../../utils'
import keys from '../../keys'

const meta = new SlashCommandBuilder()
    .setName('info')
    .setDescription('Zeige Informationen über den Bot an.')

export default command(meta, async ({ interaction, client }) => {

    // Get bot profile picture URL
    const avatarURL = client.user?.avatarURL()

    // Get User by ID
    const ImDinnerCat = await client.users.fetch('471076195233038345') ?? 'ImDinnerCat#0001'
    
    // Embed for the info command with bot profile picture as thumbnail
    const embed = new EmbedBuilder()
        .setTitle('ModCat - Discord Moderation-Bot')
        .setDescription('Informationen über den ModCat Discord Moderation-Bot.')
        .addFields([
            {
                name: 'Beschreibung',
                value: `ModCat ist der hauseigene Moderation-Bot für den **${interaction.guild?.name}** Discord Server. Er entlastet die Moderatoren und hilft ihnen bei der Arbeit, in dem er automatisierte Moderationsaufgaben übernimmt. Außerdem bietet er eine Vielzahl an nützlichen Funktionen, die das Leben der Moderatoren und der Community erleichtern.`,
            },
            {
                name: 'Entwickler',
                value: `${ImDinnerCat}`,
                inline: true,
            },
            {
                name: 'Version',
                value: keys.version,
                inline: true,
            },
        ])
        .setColor(0xFEC200)
        .setThumbnail(`${avatarURL}`)
        

    return interaction.reply({
        ephemeral: false,
        embeds: [embed],
    })

})
