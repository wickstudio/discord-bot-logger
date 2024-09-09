const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const path = require('path');

function truncateText(text, maxLength = 200) {
  if (text && text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text || 'No content';
}

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {
    try {
      if (newMessage.author.id === client.user.id) return;

      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.editMessage;

      if (!logSettings.enabled) return;

      const logChannel = newMessage.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const user = newMessage.author;

      const fetchedLogs = await newMessage.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MessageUpdate,
      }).catch(error => {
        console.error('Error fetching audit logs:', error);
        return null;
      });

      let editor;
      if (fetchedLogs) {
        const updateLog = fetchedLogs.entries.first();
        if (updateLog) {
          const { executor, target, createdTimestamp } = updateLog;

          const timeDifference = Date.now() - createdTimestamp;
          if (target.id === newMessage.author.id && timeDifference < 5000) {
            editor = executor;
          }
        }
      }

      const editedBy = editor 
        ? `${lang.edited_by}: <@${editor.id}> (\`${editor.tag}\`)`
        : `${lang.edited_by}: <@${user.id}> (\`${user.tag}\`)`;

      const editTime = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' });

      const truncatedOldMessage = truncateText(oldMessage.content);
      const truncatedNewMessage = truncateText(newMessage.content);

      const embed = new EmbedBuilder()
        .setAuthor({ name: `✏️ ${lang.message_edited}`, iconURL: client.user.displayAvatarURL() })
        .setColor(logSettings.embedColor || '#5865F2')
        .setDescription(`${editedBy}\n${user ? `**${lang.message_author}:** <@${user.id}>` : ''}`)
        .addFields(
          { name: lang.original_message, value: `\`\`\`${truncatedOldMessage}\`\`\``, inline: false },
          { name: lang.edited_message, value: `\`\`\`${truncatedNewMessage}\`\`\``, inline: false }
        )
        .addFields(
          { name: lang.channel, value: `<#${newMessage.channel.id}> (\`${newMessage.channel.name}\`)`, inline: true },
          { name: lang.time_of_edit, value: `${editTime.split(',')[1].trim()}`, inline: true }
        )
        .setFooter({ text: `${lang.user_id}: ${user.id}`, iconURL: user.displayAvatarURL() })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error in messageUpdate event:', error);
    }
  },
};
