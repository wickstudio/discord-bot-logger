const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'roleUpdate',
  async execute(oldRole, newRole) {
    try {
      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.roleUpdate;

      if (!logSettings.enabled) return;

      const logChannel = newRole.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const fetchedLogs = await newRole.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.RoleUpdate,
      }).catch(error => {
        console.error('Error fetching audit logs:', error);
        return null;
      });

      if (!fetchedLogs) return;

      const roleLog = fetchedLogs.entries.first();
      const executor = roleLog ? roleLog.executor : null;

      const changes = [];
      if (oldRole.name !== newRole.name) {
        changes.push(`${lang.role_name}: \`${oldRole.name}\` ➔ \`${newRole.name}\``);
      }
      if (oldRole.color !== newRole.color) {
        changes.push(`${lang.role_color}: \`${oldRole.hexColor}\` ➔ \`${newRole.hexColor}\``);
      }
      if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
        changes.push(`${lang.role_permissions_changed}`);
      }

      if (changes.length === 0) return;

      const embed = new EmbedBuilder()
        .setAuthor({ name: `🔧 ${lang.role_updated}`, iconURL: executor ? executor.displayAvatarURL() : newRole.guild.iconURL() })
        .setDescription(`${lang.role_updated_desc}`)
        .addFields(
          { name: lang.updated_by, value: executor ? `${executor}\nUsername: \`${executor.username}\`\nUser ID: \`${executor.id}\`` : lang.unknown, inline: false },
          { name: lang.role_name, value: `${newRole.name}`, inline: true },
          { name: lang.role_id, value: `\`${newRole.id}\``, inline: true },
          { name: lang.changes_made, value: changes.join('\n'), inline: false }
        )
        .setColor(logSettings.embedColor || '#1E90FF')
        .setFooter({ text: `Role updated at ${new Date().toLocaleString('en-US', { timeZone: 'UTC', timeStyle: 'short' })}` })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error in roleUpdate event:', error);
    }
  },
};
