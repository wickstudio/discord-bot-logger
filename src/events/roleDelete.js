const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'roleDelete',
  async execute(role) {
    try {
      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.roleDelete;

      if (!logSettings.enabled) return;

      const logChannel = role.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const fetchedLogs = await role.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.RoleDelete,
      }).catch(error => {
        console.error('Error fetching audit logs:', error);
        return null;
      });

      if (!fetchedLogs) return;

      const roleLog = fetchedLogs.entries.first();
      const executor = roleLog ? roleLog.executor : null;

      const embed = new EmbedBuilder()
        .setAuthor({ name: `🗑️ ${lang.role_deleted}`, iconURL: executor ? executor.displayAvatarURL() : role.guild.iconURL() })
        .setDescription(`${lang.role_deleted_desc}`)
        .addFields(
          { name: lang.deleted_by, value: executor ? `${executor}\nUsername: \`${executor.username}\`\nUser ID: \`${executor.id}\`` : lang.unknown, inline: false },
          { name: lang.role_name, value: `${role.name}`, inline: true },
          { name: lang.role_id, value: `\`${role.id}\``, inline: true },
          { name: lang.deleted_at, value: new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' }), inline: false }
        )
        .setColor(logSettings.embedColor || '#FF6347')
        .setFooter({ text: `Role deleted at ${new Date().toLocaleString('en-US', { timeZone: 'UTC', timeStyle: 'short' })}` })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error in roleDelete event:', error);
    }
  },
};
