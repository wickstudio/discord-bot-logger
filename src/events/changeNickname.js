const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    try {
      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.changeNickname;

      if (!logSettings.enabled) return;

      const logChannel = newMember.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const oldNickname = oldMember.nickname || oldMember.user.username;
      const newNickname = newMember.nickname || newMember.user.username;

      if (oldNickname === newNickname) return;

      const fetchedLogs = await newMember.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberUpdate,
      }).catch(error => {
        console.error('Error fetching audit logs:', error);
        return null;
      });

      const nicknameLog = fetchedLogs.entries.first();
      let executor = null;

      if (nicknameLog) {
        const { executor: nicknameExecutor, target, changes, createdTimestamp } = nicknameLog;
        const timeDifference = Date.now() - createdTimestamp;
        const nicknameChange = changes.find(change => change.key === 'nick');

        if (target.id === newMember.id && timeDifference < 5000 && nicknameChange) {
          executor = nicknameExecutor;
        }
      }

      const changedBy = executor 
        ? `${lang.changed_by} <@${executor.id}>\nUsername: \`${executor.username}\`\nUser ID: \`${executor.id}\``
        : lang.self_changed;

      const embed = new EmbedBuilder()
        .setAuthor({ name: `✏️ ${lang.nickname_changed}`, iconURL: newMember.user.displayAvatarURL() })
        .setDescription(`${lang.nickname_changed_desc}`)
        .addFields(
          { name: lang.member_name, value: `<@${newMember.id}>\nUsername: \`${newMember.user.username}\`\nUser ID: \`${newMember.id}\``, inline: false },
          { name: lang.old_nickname, value: `\`${oldNickname}\``, inline: true },
          { name: lang.new_nickname, value: `\`${newNickname}\``, inline: true },
          { name: lang.changed_by, value: changedBy, inline: false },
          { name: lang.time_of_change, value: new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' }), inline: false }
        )
        .setColor(logSettings.embedColor || '#FFA500')
        .setFooter({ text: `Nickname changed at ${new Date().toLocaleString('en-US', { timeZone: 'UTC', timeStyle: 'short' })}` })
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(error => {
        console.error('Error sending nickname change log embed:', error);
      });

    } catch (error) {
      console.error('Error in guildMemberUpdate event:', error);
    }
  },
};
