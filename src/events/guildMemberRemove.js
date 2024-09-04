const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    try {
      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.kickMember;

      if (!logSettings.enabled) return;

      const logChannel = member.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const fetchedLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberKick,
      }).catch(error => {
        console.error('Error fetching audit logs:', error);
        return null;
      });

      const kickLog = fetchedLogs?.entries.first();
      let kicked = false;
      let executor;

      if (kickLog) {
        const { executor: logExecutor, target, createdTimestamp } = kickLog;

        if (target.id === member.id && (Date.now() - createdTimestamp) < 5000) {
          kicked = true;
          executor = logExecutor;
        }
      }

      const actionBy = kicked ? `${lang.kicked_by} <@${executor.id}>` : `${lang.member_left}`;

      const leaveTime = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' });

      const embed = new EmbedBuilder()
        .setAuthor({ name: kicked ? `${lang.kicked}` : `${lang.member_left}`, iconURL: client.user.displayAvatarURL() })
        .setDescription(`**${lang.member_name}**\nUser: <@${member.id}>\nUsername: \`${member.user.username}\`\nUser ID: \`${member.id}\``)
        .addFields(
          { name: kicked ? lang.kicked_by : lang.left_at, value: kicked ? `<@${executor.id}>` : leaveTime, inline: false },
          { name: lang.total_members, value: `${member.guild.memberCount}`, inline: false }
        )
        .setColor(logSettings.embedColor)
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(error => {
        console.error('Error sending kick/leave log embed:', error);
      });

    } catch (error) {
      console.error('Error in guildMemberRemove event:', error);
    }
  },
};
