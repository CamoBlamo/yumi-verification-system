require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const {
    Client,
    Collection,
    GatewayIntentBits,
    Events,
    REST,
    Routes,
    MessageFlags,
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});
client.commands = new Collection();

const commandsArrayForDiscord = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commandsArrayForDiscord.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing required properties.`);
    }
}

client.once(Events.ClientReady, async readyClient => {
    console.log(`Logged in as ${readyClient.user.tag}!`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log(`Syncing ${commandsArrayForDiscord.length} commands...`);
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commandsArrayForDiscord }
        );
        console.log('Commands synced. Bot ready.');
    } catch (error) {
        console.error('Failed to sync commands:', error);
    }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands?.get(interaction.commandName)
    if (command) {
      try {
        await command.execute(interaction)
      } catch (err) {
        console.error(`Error executing command ${interaction.commandName}:`, err)
        if (!interaction.replied) {
          await interaction.reply({ content: "Something went wrong.", ephemeral: true }).catch(() => {})
        }
      }
    }
    return
  }

  if (interaction.isButton() && interaction.customId === "yumi-verify") {
    await interaction.deferReply({ ephemeral: true })
    try {
      const res = await fetch(`${process.env.API_BASEURL}/api/discord-linking/verification`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-discord-link-secret": process.env.LINK_SECRET,
        },
        body: JSON.stringify({
          discordId: interaction.user.id,
          discordUsername: interaction.user.username,
          discordAvatarUrl: interaction.user.displayAvatarURL({ size: 128 }),
          guildId: interaction.guildId,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.ok) {
        await interaction.editReply("Unable to generate a verification link right now. Try again shortly.")
        return
      }
      await interaction.editReply(`Click here to finish verifying: ${j.url}\n\nThis link expires in 15 minutes.`)
    } catch (err) {
      console.error("Failed to create verification link:", err)
      await interaction.editReply("Something went wrong. Try again shortly.")
    }
  }
})

client.on(Events.MessageCreate, async message => {

});

client.login(process.env.DISCORD_TOKEN);