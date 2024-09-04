const { Client, GatewayIntentBits } = require('discord.js');
const { token, guildId } = require('./config');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildBans,
  ],
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    channels.forEach(channel => {
      console.log(`Fetched channel: ${channel.name}`);
    });

  } catch (error) {
    console.error('Error fetching guild or channels:', error);
  }
});

// Load events
const eventsPath = path.join(__dirname, 'src', 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);

  try {
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`Loaded event: ${file}`);
  } catch (error) {
    console.error(`Error loading event ${file}:`, error);
  }
}

const dashboardProcess = spawn('node', ['dashboard.js'], {
  stdio: 'inherit',
});

dashboardProcess.on('close', (code) => {
  console.log(`Dashboard process exited with code ${code}`);
});

client.login(token);
