const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const path = require('path');

function truncateText(text, maxLength = 200) {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
}

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    try {
      if (message.author.id === client.user.id) return;

      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.deleteMessage;

      if (!logSettings.enabled) return;

      const logChannel = message.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const user = message.author;

      const fetchedLogs = await message.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MessageDelete,
      }).catch(error => {
        console.error('Error fetching audit logs:', error);
        return null;
      });

      if (!fetchedLogs) {
        console.log('No fetched logs found');
        return;
      }

      const deletionLog = fetchedLogs.entries.first();
      let admin = null;

      if (deletionLog) {
        const { executor, target, createdTimestamp } = deletionLog;

        const timeDifference = Date.now() - createdTimestamp;
        if (target.id === message.author.id && timeDifference < 5000) {
          admin = executor;
        }
      }

      const deletedBy = admin 
        ? `Admin: ${admin.tag}\nUsername: \`${admin.username}\`\nUser ID: \`${admin.id}\``
        : lang.user_deleted_message;

      const deletionTime = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' });

      const truncatedMessage = message.content.length > 200 ? truncateText(message.content) : message.content;

      const embed = new EmbedBuilder()
        .setAuthor({ name: `🗑️ ${lang.message_deleted}`, iconURL: client.user.displayAvatarURL() })
        .setDescription(`**${lang.message_author}**\nUser: ${user.tag}\nUsername: \`${user.username}\`\nUser ID: \`${user.id}\``)
        .addFields(
          { name: lang.deleted_message_info, value: `\`\`\`${truncatedMessage || 'No content'}\`\`\``, inline: false },
          { name: lang.channel, value: `Channel: <#${message.channel.id}> \`(${message.channel.name})\``, inline: true },
          { name: lang.deleted_by, value: deletedBy, inline: true },
          { name: lang.time_of_deletion, value: deletionTime, inline: false }
        )
        .setColor(logSettings.embedColor || '#FF0000')
        .setFooter({ text: `Today at ${deletionTime.split(',')[1].trim()}` })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error logging message deletion:', error);
    }
  },
};
