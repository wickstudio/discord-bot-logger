const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const settings = require('./settings');
const { Client, GatewayIntentBits } = require('discord.js');
const { token, guildId, dashboardPort } = require('./config');

const app = express();
const port = dashboardPort;

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

client.once('ready', () => {
  console.log(`Bot is Ready as ${client.user.tag}`);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index', { settings });
});

app.get('/settings', async (req, res) => {
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    const textChannels = channels.filter(channel => channel.type === 0);

    res.render('settings', { settings, channels: textChannels });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).send('Error fetching channels.');
  }
});

app.get('/logs', (req, res) => {
  res.render('logs', { settings });
});

app.get('/status', (req, res) => {
  res.render('status', { settings });
});

app.post('/settings', (req, res) => {
  const updatedSettings = req.body;

  for (const logger in updatedSettings) {
    if (settings.loggers[logger]) {
      settings.loggers[logger].enabled = updatedSettings[logger].enabled === 'true';
      settings.loggers[logger].channelId = updatedSettings[logger].channelId;
      settings.loggers[logger].embedColor = updatedSettings[logger].embedColor;
    }
  }

  const fs = require('fs');
  fs.writeFileSync('./settings.js', `module.exports = ${JSON.stringify(settings, null, 2)};`);

  res.redirect('/settings');
});

client.login(token);

app.listen(port, () => {
  console.log(`running on port: http://localhost:${port}`);
});
