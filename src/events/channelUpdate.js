const { EmbedBuilder, AuditLogEvent, ChannelType } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel) {
    try {
      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.channelUpdate;

      if (!logSettings.enabled) return;

      const logChannel = newChannel.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const fetchedLogs = await newChannel.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.ChannelUpdate,
      }).catch(error => {
        console.error('Error fetching audit logs:', error);
        return null;
      });

      if (!fetchedLogs) return;

      const updateLog = fetchedLogs.entries.first();
      const executor = updateLog ? updateLog.executor : null;

      const changes = [];
      if (oldChannel.name !== newChannel.name) {
        changes.push(`${lang.channel_name}: \`${oldChannel.name}\` ➔ \`${newChannel.name}\``);
      }
      if (oldChannel.permissionOverwrites.cache.size !== newChannel.permissionOverwrites.cache.size) {
        changes.push(`${lang.channel_permissions_changed}`);
      }

      if (changes.length === 0) return;

      const embed = new EmbedBuilder()
        .setAuthor({ name: `🛠️ ${lang.channel_updated}`, iconURL: executor ? executor.displayAvatarURL() : newChannel.guild.iconURL() })
        .setDescription(`${lang.channel_updated_desc}`)
        .addFields(
          { name: lang.updated_by, value: executor ? `${executor}\nUsername: \`${executor.username}\`\nUser ID: \`${executor.id}\`` : lang.unknown, inline: false },
          { name: lang.channel_name, value: `<#${newChannel.id}>`, inline: true },
          { name: lang.channel_id, value: `\`${newChannel.id}\``, inline: true },
          { name: lang.changes_made, value: changes.join('\n'), inline: false }
        )
        .setColor(logSettings.embedColor || '#FFA500')
        .setFooter({ text: `Channel updated at ${new Date().toLocaleString('en-US', { timeZone: 'UTC', timeStyle: 'short' })}` })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error in channelUpdate event:', error);
    }
  },
};
