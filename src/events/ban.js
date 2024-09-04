const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    try {
      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.banMember;

      if (!logSettings.enabled) return;

      const logChannel = ban.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const fetchedLogs = await ban.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd,
      }).catch(error => {
        console.error('Error fetching audit logs:', error);
        return null;
      });

      const banLog = fetchedLogs?.entries.first();
      let executor;

      if (banLog) {
        const { executor: logExecutor, target, createdTimestamp } = banLog;

        if (target.id === ban.user.id && (Date.now() - createdTimestamp) < 5000) {
          executor = logExecutor;
        }
      }

      const bannedBy = executor ? `${lang.banned_by}` : `${lang.unknown}`;

      const banTime = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' });

      const embed = new EmbedBuilder()
        .setAuthor({ name: lang.banned, iconURL: client.user.displayAvatarURL() })
        .setDescription(`**${lang.member_name}**\nUser: <@${ban.user.id}>\nUsername: \`${ban.user.username}\`\nUser ID: \`${ban.user.id}\``)
        .addFields(
          { name: bannedBy, value: `<@${executor?.id || ''}>`, inline: false },
          { name: lang.ban_reason, value: ban.reason || lang.no_reason_provided, inline: false },
          { name: lang.total_members, value: `${ban.guild.memberCount}`, inline: false }
        )
        .setColor(logSettings.embedColor)
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(error => {
        console.error('Error sending ban log embed:', error);
      });

    } catch (error) {
      console.error('Error in guildBanAdd event:', error);
    }
  },
};
