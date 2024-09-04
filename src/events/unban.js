const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'guildBanRemove',
  async execute(unban, client) {
    try {
      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.unbanMember;

      if (!logSettings.enabled) return;

      const logChannel = unban.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const fetchedLogs = await unban.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanRemove,
      }).catch(error => {
        console.error('Error fetching audit logs:', error);
        return null;
      });

      const unbanLog = fetchedLogs?.entries.first();
      let executor;

      if (unbanLog) {
        const { executor: logExecutor, target, createdTimestamp } = unbanLog;

        if (target.id === unban.user.id && (Date.now() - createdTimestamp) < 5000) {
          executor = logExecutor;
        }
      }

      const unbannedBy = executor ? `${lang.unbanned_by}` : `${lang.unknown}`;

      const unbanTime = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' });

      const embed = new EmbedBuilder()
        .setAuthor({ name: lang.unbanned, iconURL: client.user.displayAvatarURL() })
        .setDescription(`**${lang.member_name}**\nUser: <@${unban.user.id}>\nUsername: \`${unban.user.username}\`\nUser ID: \`${unban.user.id}\``)
        .addFields(
          { name: unbannedBy, value: `<@${executor?.id || ''}>`, inline: false },
          { name: lang.total_members, value: `${unban.guild.memberCount}`, inline: false }
        )
        .setColor(logSettings.embedColor)
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(error => {
        console.error('Error sending unban log embed:', error);
      });

    } catch (error) {
      console.error('Error in guildBanRemove event:', error);
    }
  },
};
