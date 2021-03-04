const Discord = require("discord.js")
const vcroledb = require("quick.db")
require("dotenv").config()

const client = new Discord.Client()

client.once ("ready", () => {
	console.log("bot running"),
	(function startUpdatingStatus () {
		client.user.setActivity(`${client.guilds.cache.size} servers`, { type: 'WATCHING' }).catch(console.error) // update status
		setTimeout(() => startUpdatingStatus(), 3600000) // run again in an hour
	})()
})

client.login(process.env.bottoken)

client.on ("message", message => {

	if (!message.content.startsWith("^")) return // return if the message does not begin with the prefix

	const args = message.content.slice(1).split(" ")
	const command = args.shift()


	if (command=="vcrole") {
		
		// get role id
		var roleID

		if (args[0] == undefined) roleID = "not given"
		else if (args[0] == "clear") roleID = "clear"
		else if (args[0].startsWith("<@&") && args[0].endsWith(">") && args[0].length==22) {
			// use role mention
			roleID = args[0].substring(3,21)
		} else if (args[0].length==18) {
			// use role id
			roleID = args[0]
		}
		
		console.log(roleID)

		// get channel/guild id
		let argLoc = args[1]
		if (argLoc==undefined) argLoc = "not given"
		if (argLoc.length==18) {
			// a voice channel id was specified, use this
			locType = "vc"
			locID = argLoc
		} else {
			// no channel id was specified, use the guild id
			locType = "guild"
			locID = message.guild.id
		}

		if (roleID=="clear") specifiedRole = message.guild.roles.cache.get(vcroledb.get(locID))
		else specifiedRole = message.guild.roles.cache.get(roleID)
		const specifiedVC = client.channels.cache.get(args[1])
	
		// catch possible errors with a readable error message
		if (roleID == "not given") result = {success: false, reason: "No role was specified."}
		else if (specifiedRole == undefined) result = {success: false, reason: "The specified role does not exist."}
		else if (specifiedRole.guild.id != message.guild.id) result = {success: false, reason: "The specified role is not this server."}
		else if (message.guild.me.roles.highest.comparePositionTo(specifiedRole) <= 0) result = {success: false, reason: "The specified role is higher than the bot's highest role."}
		else if (!message.guild.me.hasPermission(["MANAGE_ROLES", "VIEW_CHANNEL"])) result = {success: false, reason: "The bot does not have the necessary permissions (manage roles and view channels)."}
		else if (!message.member.hasPermission("MANAGE_ROLES")) result = {success: false, reason: "You do not have permission to do that. You need the Manage Roles permission."}
		else if (locType=="vc") {
			if (specifiedVC == undefined) result = {success: false, reason: "The specified voice channel does not exist."}
			else if (specifiedVC.guild.id != message.guild.id) result = {success: false, reason: "The specified voice channel is not this server."}
			else if (specifiedVC.type != "voice") result = {success: false, reason: "The specified channel is not a voice channel."}
			else result = {success: true}
		}
		else result = {success: true}


		if (result.success) {

			// store the given info and tell the user it succeeded

			if (roleID=="clear") {
				vcroledb.delete(locID)
				resultMsg = `Voice channel role cleared successfully`
			} else {
				vcroledb.set(locID, roleID)
				resultMsg = `Voice channel role set successfully to \`${specifiedRole.name}\``
			}
		
			if (locType == "vc") resultMsg = resultMsg.concat(` for channel \`${specifiedVC.name}\``)
			else if (locType == "guild") resultMsg = resultMsg.concat(` for server \`${message.guild.name}\``)
			message.channel.send(resultMsg)
			
		} else {
			// tell the user why it failed
			message.channel.send(`Setting the role failed for the following reason: ${result.reason}`)
		}

	}

})

// detect when a member joins or leaves a voice channel, and give them the role if applicable
client.on("voiceStateUpdate", (oldState, newState) => {

	if (oldState.member.user.bot) return

	if (oldState.channelID!=null && newState.channelID==null) {
		join = false
		leave = true
	}
	else if (oldState.channelID==null && newState.channelID!=null) {
		join = true
		leave = false
	} else if (oldState.channelID!=null && newState.channelID!=null && oldState.channelID!=newState.channelID) {
		join = true
		leave = true
	}
	else return


	if (leave) {
		const channel = oldState.channel
		
		if (vcroledb.has(channel.id)) {
			// use a channel location
			newState.member.roles.remove (
				channel.guild.roles.cache.get (
					vcroledb.get(channel.id)
				)
			)
		}
	
		if (vcroledb.has(channel.guild.id)) {
			// use a guild location
			newState.member.roles.remove(
				channel.guild.roles.cache.get(
					vcroledb.get(channel.guild.id)
				)
			)	
		}
	}

	if (join) {
		const channel = newState.channel

		if (vcroledb.has(channel.id)) {
			// use a channel location
			newState.member.roles.add (
				channel.guild.roles.cache.get (
					vcroledb.get(channel.id)
				)
			)
		}
	
		if (vcroledb.has(channel.guild.id)) {
			// use a guild location
			newState.member.roles.add (
				channel.guild.roles.cache.get (
					vcroledb.get(channel.guild.id)
					)
				)
		}
	}
})
