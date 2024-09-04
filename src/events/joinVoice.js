const { EmbedBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    try {
      if (!oldState.channel && newState.channel) {
        delete require.cache[require.resolve('../../settings')];
        const settings = require('../../settings');

        const logSettings = settings.loggers.joinVoice;

        if (!logSettings.enabled) return;

        const logChannel = newState.guild.channels.cache.get(logSettings.channelId);
        if (!logChannel) {
          console.error(`Log channel not found: ${logSettings.channelId}`);
          return;
        }

        const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
        delete require.cache[require.resolve(langPath)];
        const lang = require(langPath);

        const member = newState.member;
        const channel = newState.channel;

        const embed = new EmbedBuilder()
          .setAuthor({ name: `🎤 ${lang.joined_voice}`, iconURL: member.user.displayAvatarURL() })
          .setDescription(`${lang.joined_voice_desc}`)
          .addFields(
            { name: lang.member_name, value: `<@${member.id}>\nUsername: \`${member.user.username}\`\nUser ID: \`${member.id}\``, inline: false },
            { name: lang.voice_channel, value: `<#${channel.id}> (${channel.id})`, inline: true },
            { name: lang.joined_at, value: new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' }), inline: false }
          )
          .setColor(logSettings.embedColor || '#00BFFF')
          .setFooter({ text: `Joined at ${new Date().toLocaleString('en-US', { timeZone: 'UTC', timeStyle: 'short' })}` })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in voiceStateUpdate event:', error);
    }
  },
};
