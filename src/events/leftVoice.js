const { EmbedBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    try {
      if (oldState.channel && !newState.channel) {
        delete require.cache[require.resolve('../../settings')];
        const settings = require('../../settings');

        const logSettings = settings.loggers.leftVoice;

        if (!logSettings.enabled) return;

        const logChannel = oldState.guild.channels.cache.get(logSettings.channelId);
        if (!logChannel) {
          console.error(`Log channel not found: ${logSettings.channelId}`);
          return;
        }

        const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
        delete require.cache[require.resolve(langPath)];
        const lang = require(langPath);

        const member = oldState.member;
        const channel = oldState.channel;

        const memberName = `<@${member.id}>\nUsername: \`${member.user.username}\`\nUser ID: \`${member.id}\``;
        const channelInfo = channel ? `<#${channel.id}> (${channel.id})` : 'Unknown channel';
        const leftAt = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' });

        const embed = new EmbedBuilder()
          .setAuthor({ name: `🎤 ${lang.left_voice || 'Left Voice Channel'}`, iconURL: member.user.displayAvatarURL() })
          .setDescription(`${lang.left_voice_desc || 'A member has left a voice channel.'}`)
          .addFields(
            { name: lang.member_name || 'Member Name', value: memberName, inline: false },
            { name: lang.voice_channel || 'Voice Channel', value: channelInfo, inline: true },
            { name: lang.left_at || 'Left At', value: leftAt, inline: false }
          )
          .setColor(logSettings.embedColor || '#FF4500')
          .setFooter({ text: `Left at ${new Date().toLocaleString('en-US', { timeZone: 'UTC', timeStyle: 'short' })}` })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in voiceStateUpdate event:', error);
    }
  },
};
