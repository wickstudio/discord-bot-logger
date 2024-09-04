const { EmbedBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      delete require.cache[require.resolve('../../settings')];
      const settings = require('../../settings');

      const logSettings = settings.loggers.joinMember;

      if (!logSettings.enabled) return;

      const logChannel = member.guild.channels.cache.get(logSettings.channelId);
      if (!logChannel) {
        console.error(`Log channel not found: ${logSettings.channelId}`);
        return;
      }

      const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
      delete require.cache[require.resolve(langPath)];
      const lang = require(langPath);

      const joinTime = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' });

      const embed = new EmbedBuilder()
        .setAuthor({ name: `🎉 ${lang.member_joined}`, iconURL: member.user.displayAvatarURL() })
        .setDescription(`${member} ${lang.member_joined}`)
        .addFields(
          { name: lang.member_name, value: `User: ${member}\nUsername: \`${member.user.username}\`\nUser ID: \`${member.user.id}\``, inline: false },
          { name: lang.joined_at, value: joinTime, inline: true },
          { name: lang.total_members, value: `${member.guild.memberCount}`, inline: true }
        )
        .setColor(logSettings.embedColor || '#00FF00')
        .setFooter({ text: `User joined at ${joinTime.split(',')[1].trim()}`, iconURL: member.user.displayAvatarURL() })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error in guildMemberAdd event:', error);
    }
  },
};
