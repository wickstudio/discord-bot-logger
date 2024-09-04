const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const path = require('path');

module.exports = {
    name: Events.MessageBulkDelete,
    async execute(messages, client) {
        try {
            delete require.cache[require.resolve('../../settings')];
            const settings = require('../../settings');

            const logSettings = settings.loggers.messageBulkDeleteLog;

            if (!logSettings.active) return;

            const logChannel = messages.first().guild.channels.cache.get(logSettings.logChannelId);
            if (!logChannel) {
                console.error(`Log channel not found: ${logSettings.logChannelId}`);
                return;
            }

            const langPath = path.join(__dirname, '..', '..', 'src', 'lang', `${settings.language}.json`);
            delete require.cache[require.resolve(langPath)];
            const lang = require(langPath);

            const fetchedLogs = await messages.first().guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MessageBulkDelete,
            }).catch(error => {
                console.error('Error fetching audit logs:', error);
                return null;
            });

            let executor = lang.unknown;

            if (fetchedLogs) {
                const deleteLog = fetchedLogs.entries.first();
                if (deleteLog) {
                    const { executor: logExecutor, createdTimestamp } = deleteLog;
                    if (createdTimestamp > (Date.now() - 5000)) {
                        executor = `<@${logExecutor.id}>`;
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setColor(logSettings.embedColor || '#FFA500')
                .setAuthor({ name: `🧹 ${lang.bulk_message_deletion}`, iconURL: client.user.displayAvatarURL() })
                .setDescription(`${lang.bulk_message_deletion_desc} <#${messages.first().channel.id}>.`)
                .addFields(
                    { name: lang.deleted_by, value: executor, inline: true },
                    { name: lang.channel, value: `<#${messages.first().channel.id}>`, inline: true },
                    { name: lang.deleted_at, value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: lang.number_of_messages_deleted, value: `${messages.size}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `${lang.channel_id}: ${messages.first().channel.id}` });

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging bulk message deletion:', error);
        }
    },
};
