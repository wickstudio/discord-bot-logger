const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    try {
      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.roleAdd;

      if (!logSettings.enabled) return;

      const logChannel = newMember.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
      if (addedRoles.size === 0) return;

      const fetchedLogs = await newMember.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberRoleUpdate,
      }).catch(error => {
        console.error('Error fetching audit logs:', error);
        return null;
      });

      const roleLog = fetchedLogs.entries.first();
      let executor = null;

      if (roleLog) {
        const { executor: roleExecutor, target, createdTimestamp } = roleLog;
        const timeDifference = Date.now() - createdTimestamp;
        if (target.id === newMember.id && timeDifference < 5000) {
          executor = roleExecutor;
        }
      }

      const addedBy = executor 
        ? `${lang.added_by} <@${executor.id}>\nUsername: \`${executor.username}\`\nUser ID: \`${executor.id}\``
        : lang.unknown;

      const embed = new EmbedBuilder()
        .setAuthor({ name: `🏅 ${lang.role_added}`, iconURL: newMember.user.displayAvatarURL() })
        .setDescription(`${lang.role_added_desc}`)
        .addFields(
          { name: lang.member_name, value: `<@${newMember.id}>\nUsername: \`${newMember.user.username}\`\nUser ID: \`${newMember.id}\``, inline: false },
          { name: lang.role_name, value: addedRoles.map(role => `<@&${role.id}>`).join(', '), inline: false },
          { name: lang.added_by, value: addedBy, inline: false },
          { name: lang.time_of_addition, value: new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' }), inline: false }
        )
        .setColor(logSettings.embedColor || '#00FF00')
        .setFooter({ text: `Role added at ${new Date().toLocaleString('en-US', { timeZone: 'UTC', timeStyle: 'short' })}` })
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(error => {
        console.error('Error sending role addition log embed:', error);
      });

    } catch (error) {
      console.error('Error in guildMemberUpdate event:', error);
    }
  },
};
