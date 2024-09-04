const { EmbedBuilder, AuditLogEvent, ChannelType } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    try {
      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.channelDelete;

      if (!logSettings.enabled) return;

      const logChannel = channel.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const fetchedLogs = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.ChannelDelete,
      }).catch(error => {
        console.error('Error fetching audit logs:', error);
        return null;
      });

      if (!fetchedLogs) return;

      const channelLog = fetchedLogs.entries.first();
      const executor = channelLog ? channelLog.executor : null;

      const channelType = (() => {
        switch (channel.type) {
          case ChannelType.GuildText: return 'Text';
          case ChannelType.GuildVoice: return 'Voice';
          case ChannelType.GuildCategory: return 'Category';
          case ChannelType.GuildNews: return 'News';
          case ChannelType.GuildStageVoice: return 'Stage';
          case ChannelType.GuildForum: return 'Forum';
          default: return 'Unknown';
        }
      })();

      const embed = new EmbedBuilder()
        .setAuthor({ name: `🗑️ ${lang.channel_deleted}`, iconURL: executor ? executor.displayAvatarURL() : channel.guild.iconURL() })
        .setDescription(`**${lang.channel_name}**\n#${channel.name}\n**${lang.channel_type}**\n${channelType}`)
        .addFields(
          { name: lang.deleted_by, value: executor ? `${executor}\nUsername: \`${executor.username}\`\nUser ID: \`${executor.id}\`` : lang.unknown, inline: false },
          { name: lang.channel_id, value: `\`${channel.id}\``, inline: true },
          { name: lang.channel_deleted_at, value: new Date(channel.createdAt).toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' }), inline: true }
        )
        .setColor(logSettings.embedColor || '#FF4500')
        .setFooter({ text: `Channel deleted at ${new Date(channel.createdAt).toLocaleString('en-US', { timeZone: 'UTC', timeStyle: 'short' })}` })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error in channelDelete event:', error);
    }
  },
};
