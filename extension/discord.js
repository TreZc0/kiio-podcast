
// Imports
const Discord = require('discord.js');
const nodecg = require('./util/nodecg-api-context').get();

// NodeCG
const log = new nodecg.Logger(`${nodecg.bundleName}:discord`);
const voiceActivity = nodecg.Replicant('voiceActivity', {
	defaultValue: {
		members: []
	}, persistent: true
});

// Discord API
const bot = new Discord.Client();
const botToken = nodecg.bundleConfig.discord.token;
const botServerID = nodecg.bundleConfig.discord.serverID;
const botCommandChannelID = nodecg.bundleConfig.discord.commandChannelID;
const botVoiceCommentaryChannelID = nodecg.bundleConfig.discord.voiceChannelID;

// Variables
let botIsReady = false;
let voiceChannelConnection;

// Connection
bot.on('ready', () => {
	log.info('Logged in as %s - %s\n', bot.user.username, bot.user.id);

	botIsReady = true;
});
bot.on('error', () => {
	log.error('The bot encountered a connection error!!');

	botIsReady = false;

	setTimeout(() => {
		bot.login(botToken);
	}, 10000);
});

bot.on('disconnect', () => {
	log.error('The bot disconnected!!');

	botIsReady = false;

	setTimeout(() => {
		bot.login(botToken);
	}, 10000);
});

bot.login(botToken);

// Voice
bot.on('voiceStateUpdate', () => {

	UpdateCommentaryChannelMembers();

});

function UpdateCommentaryChannelMembers()
{
	if (!voiceActivity || !voiceActivity.value)
		return;

	const memberArray = Array.from(bot.guilds.get(botServerID).channels.get(botVoiceCommentaryChannelID).members.values());

	if (!memberArray || memberArray.length < 1)
	{
		voiceActivity.value.members.length = 0;
		return;
	}

	const newVoiceArray = [];

	memberArray.forEach(voiceMember => {

		if (voiceMember.user.tag != 'PodCastBot#7642')
		{
			let userAvatar = voiceMember.user.avatarURL;

			if (!userAvatar || userAvatar == null)
			{
				userAvatar = 'https://discordapp.com/assets/dd4dbc0016779df1378e7812eabaa04d.png';
			} // Default avatar

			let speakStatus = voiceMember.speaking;

			if (!speakStatus || speakStatus === null)
			{
				speakStatus = false;
			}
			log.info(voiceMember.displayName + " has changed their speaking status: " + speakStatus);
			newVoiceArray.push({id: voiceMember.user.id, name: voiceMember.displayName, avatar: userAvatar, isSpeaking: speakStatus});
		}
	});

	voiceActivity.value.members = newVoiceArray;
}

// Commands
function commandChannel(message) {
	// ADMIN COMMANDS
	if (message.member.hasPermission('MANAGE_CHANNELS')) {
		if (message.content.toLowerCase() === '!commands') {
			message.reply('ADMIN: [!bot join | !bot leave]');

		}

		else if (message.content.toLowerCase() === '!bot join') {

			if (voiceChannelConnection) {
				message.reply('I already entered the podcast channel!');
				return;
			}

			voiceChannelConnection = bot.guilds.get(botServerID).channels.get(botVoiceCommentaryChannelID).join().then(connection => {

				voiceChannelConnection = connection;

				UpdateCommentaryChannelMembers();

				connection.on('speaking', (user, speaking) => {

					if (!voiceActivity.value.members || voiceActivity.value.members.length < 1)
						{return;}

					voiceActivity.value.members.find(voiceMember => {

						if (voiceMember.id == user.id) {
							voiceMember.isSpeaking = speaking; // Delay this by streamleader delay/current obs timeshift delay if its activated with setTimeout
							return true;
						}

						return false;

					});
				});
			});

		}
		else if (message.content.toLowerCase() === '!bot leave') {

			if (!voiceChannelConnection) {
				message.reply('I\'m not in the podcast channel!');
				return;
			}

			bot.guilds.get(botServerID).channels.get(botVoiceCommentaryChannelID).leave();

			voiceChannelConnection = null;
		}
	}
}

// Message Handling
bot.on('message', message => {
	if (message.channel.id == botCommandChannelID) {
        commandChannel(message);
        return;
	}
	if (message.content.toLowerCase() == '!status') {
        message.reply('Hey! I\'m online and ready to track the voice channel!');

	}
});
