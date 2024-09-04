const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    try {
      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      if (!settings || !settings.loggers || !settings.loggers.statsVoice) {
        console.error('StatsVoice settings not found.');
        return;
      }

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
      const changes = [];

      if (oldState.serverMute !== newState.serverMute) {
        changes.push(newState.serverMute ? lang.server_muted : lang.server_unmuted);
      }

      if (oldState.serverDeaf !== newState.serverDeaf) {
        changes.push(newState.serverDeaf ? lang.server_deafened : lang.server_undeafened);
      }

      if (oldState.channelId !== newState.channelId) {
        if (oldState.channelId && !newState.channelId) {
          changes.push(lang.left_channel);
        } else if (!oldState.channelId && newState.channelId) {
          changes.push(`${lang.joined_channel} <#${newState.channelId}>`);
        } else if (oldState.channelId && newState.channelId) {
          changes.push(`${lang.switched_channel} <#${newState.channelId}>`);
        }
      }

      if (changes.length === 0) return;

      const fetchedLogs = await newState.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberUpdate,
      }).catch(error => {
        console.error('Error fetching audit logs:', error);
        return null;
      });

      let adminInfo = null;
      if (fetchedLogs) {
        const updateLog = fetchedLogs.entries.first();
        if (updateLog) {
          const { executor, target } = updateLog;
          if (target.id === newState.member.id) {
            adminInfo = `Admin: <@${executor.id}>\nUsername: \`${executor.username}\`\nUser ID: \`${executor.id}\``;
          }
        }
      }

      const fields = [
        { name: lang.member_name, value: `<@${member.id}>\nUsername: \`${member.user.username}\`\nUser ID: \`${member.id}\``, inline: false },
      ];

      if (changes.length > 0 && changes.join('\n').trim() !== '') {
        fields.push({ name: lang.changes_made, value: changes.join('\n'), inline: false });
      }

      if (adminInfo) {
        fields.push({ name: 'Admin', value: adminInfo, inline: false });
      }

      fields.push(
        { name: lang.time_of_change, value: new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' }), inline: false }
      );

      if (fields.some(field => field.value && field.value.trim() !== '')) {
        const embed = new EmbedBuilder()
          .setAuthor({ name: `🎙️ ${lang.voice_state_changed}`, iconURL: member.user.displayAvatarURL() })
          .setDescription(`${lang.voice_state_changed_desc}`)
          .addFields(fields)
          .setColor(logSettings.embedColor || '#FF4500')
          .setFooter({ text: `Changed at ${new Date().toLocaleString('en-US', { timeZone: 'UTC', timeStyle: 'short' })}` })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in voiceStateUpdate event:', error);
    }
  },
};
