# Wick Logger Bot V2

Wick Logger Bot V2 is a powerful Discord bot designed to monitor and log various server events, providing detailed logs for messages, channels, roles, voice activities, and more. This bot also features an easy-to-use web dashboard for managing its settings.

## Features

- **Message Logging**: Logs deleted and edited messages.
- **Member Events**: Logs member joins, leaves, bans, and unbans.
- **Channel Events**: Logs channel creation, deletion, and updates.
- **Role Events**: Logs role creations, deletions, and updates.
- **Voice Activity**: Logs when users join, leave, or switch voice channels.
- **Nickname Changes**: Logs nickname changes.
- **Bulk Message Deletions**: Logs bulk deletions of messages.
- **Web Dashboard**: Manage the bot’s settings and event logs through a customizable dashboard.
- **Multi-Language Support**: Includes translations in Arabic and English.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Commands](#commands)
- [Event Loggers](#event-loggers)
- [Web Dashboard](#web-dashboard)
- [License](#license)

## Installation

### Prerequisites

Before you begin, ensure you have the following:

- Node.js (v14.0.0 or higher)
- Discord.js v14.15.3
- Express.js v4.19.2
- EJS templating engine

### Steps

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/wickstudio/discord-bot-logger.git
   cd discord-bot-logger
   ```

2. Install the required dependencies:

   ```bash
   npm install
   ```

3. Set up the environment variables in the `config.js` file:

   ```js
   module.exports = {
       token: 'YOUR_DISCORD_BOT_TOKEN',
       clientId: 'YOUR_DISCORD_CLIENT_ID',
       guildId: 'YOUR_DISCORD_GUILD_ID',
       dashboardPort: 8000,  // Change the port number if needed
   };
   ```

4. Start the bot and the web dashboard:

   ```bash
   npm start
   ```

   This will launch both the Discord bot and the dashboard on the port specified in `config.js`.

## Configuration

### Discord Bot Token and Guild ID

Update the following in `config.js` with your bot’s token, client ID, and guild ID:

```js
module.exports = {
    token: 'YOUR_DISCORD_BOT_TOKEN',
    clientId: 'YOUR_DISCORD_CLIENT_ID',
    guildId: 'YOUR_DISCORD_GUILD_ID',
    dashboardPort: 8000,
};
```

### Web Dashboard Configuration

You can change the port for the dashboard by modifying the `dashboardPort` variable in `config.js`. The default port is `8000`.

## Commands

The bot automatically logs the following events when they occur in your Discord server:

- **Message Events**:
  - Deleted Messages
  - Edited Messages
  - Bulk Message Deletions
- **Member Events**:
  - Member Joins
  - Member Leaves
  - Member Bans
  - Member Unbans
- **Channel Events**:
  - Channel Creation
  - Channel Deletion
  - Channel Updates
- **Role Events**:
  - Role Creation
  - Role Deletion
  - Role Updates
- **Voice Activity Events**:
  - Member Joins Voice
  - Member Leaves Voice
  - Member Switches Voice Channel

## Event Loggers

The bot supports the following loggers, which can be enabled or disabled through the web dashboard:

- **Message Events**:
  - `deleteMessage` - Log deleted messages.
  - `editMessage` - Log edited messages.
  - `messageBulkDeleteLog` - Log bulk message deletions.
- **Member Events**:
  - `joinMember` - Log when a member joins.
  - `leaveMember` - Log when a member leaves.
  - `kickMember` - Log when a member is kicked.
  - `banMember` - Log when a member is banned.
  - `unbanMember` - Log when a member is unbanned.
  - `changeNickname` - Log when a member's nickname changes.
- **Channel Events**:
  - `channelCreate` - Log channel creations.
  - `channelDelete` - Log channel deletions.
  - `channelUpdate` - Log channel updates.
- **Role Events**:
  - `roleCreate` - Log role creations.
  - `roleDelete` - Log role deletions.
  - `roleUpdate` - Log role updates.
- **Voice Activity**:
  - `joinVoice` - Log when a member joins a voice channel.
  - `leftVoice` - Log when a member leaves a voice channel.
  - `statsVoice` - Log voice channel statistics.

## Web Dashboard

The bot includes a web-based dashboard to manage loggers, allowing you to enable or disable specific event logging.

### Key Features:

- **Real-time Status**: See the current state of your bot and logs.
- **Log Settings**: Manage which events are logged.
- **Support Integration**: Includes direct links to Discord support and the bot's YouTube channel.

### Running the Dashboard

The dashboard runs on the port defined in `config.js`. By default, it’s accessible at:

```bash
http://localhost:8000
```

### Dashboard Views:

1. **Home**: Overview of bot status.
2. **Logs**: View detailed logs.
3. **Settings**: Manage logger configurations.

## Links

- **GitHub**: [https://github.com/wickstudio](https://github.com/wickstudio)
- **Discord Support**: [https://discord.gg/wicks](https://discord.gg/wicks)
- **Instagram**: [https://instagram.com/mik__subhi](https://instagram.com/mik__subhi)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.