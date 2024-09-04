const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const path = require('path');

const lastStateMap = new Map();

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    try {
      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.statsVoice;

      if (!logSettings.enabled) return;

      const logChannel = newState.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const member = newState.member;
      const guild = newState.guild;
      let changes = [];

      const currentState = [newState.serverMute, newState.serverDeaf].join('-');
      const lastState = lastStateMap.get(member.id);

      if (currentState === lastState) return;

      lastStateMap.set(member.id, currentState);

      if (oldState.serverMute !== newState.serverMute) {
        const change = newState.serverMute
          ? lang.server_muted || 'Server Muted'
          : lang.server_unmuted || 'Server Unmuted';
        changes.push(change);
      }

      if (oldState.serverDeaf !== newState.serverDeaf) {
        const change = newState.serverDeaf
          ? lang.server_deafened || 'Server Deafened'
          : lang.server_undeafened || 'Server Undeafened';
        changes.push(change);
      }

      if (changes.length > 0) {
        const fetchedLogs = await guild.fetchAuditLogs({
          limit: 5,
          type: AuditLogEvent.MemberUpdate,
        });

        const auditEntry = fetchedLogs.entries
          .filter(entry => entry.target.id === member.id)
          .find(
            entry =>
              Date.now() - entry.createdTimestamp < 5000 &&
              (entry.changes.some(change => change.key === 'mute') ||
                entry.changes.some(change => change.key === 'deaf'))
          );

        let adminInfo = 'Unknown Admin';
        if (auditEntry) {
          const executor = auditEntry.executor;
          adminInfo = `<@${executor.id}> (\`${executor.tag}\`)`;
        }

        const embed = new EmbedBuilder()
          .setAuthor({
            name: `🎙️ ${lang.voice_state_changed || 'Voice State Changed'}`,
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(
            `${member} has been ${changes.join(' and ').toLowerCase()} by ${adminInfo}.`
          )
          .addFields(
            {
              name: lang.member_name || 'Member',
              value: `${member} (\`${member.user.tag}\`)`,
              inline: true,
            },
            {
              name: lang.admin_name || 'Admin',
              value: adminInfo,
              inline: true,
            },
            {
              name: lang.changes_made || 'Action',
              value: changes.join('\n'),
              inline: false,
            },
            {
              name: lang.time_of_change || 'Time',
              value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
              inline: false,
            }
          )
          .setColor(logSettings.embedColor || '#FF4500')
          .setFooter({
            text: guild.name,
            iconURL: guild.iconURL({ dynamic: true }),
          })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in voiceStateUpdate event:', error);
    }
  },
};
