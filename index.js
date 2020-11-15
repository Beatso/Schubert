const express = require("express")
const Discord = require("discord.js")
const vcrolestore = require("data-store")({ path: process.cwd() + "/vcrole.json" })
require("dotenv").config()

const client = new Discord.Client()

client.once ("ready", _ => {
	console.log("bot running"),
	client.user.setActivity("beatso.tk/project/schubert", {type:"WATCHING"})
})

client.login(process.env.bottoken)

client.on ("message", message => {

	if (!message.content.startsWith("^")) return // return if the message does not begin with the prefix

	const args = message.content.slice(1).split(" ")
	const command = args.shift()


	if (command=="vcrole") {
		
		// get role id
		if (args[0] == undefined) roleID = "not given"
		else if (args[0] == "clear") roleID = "clear"
		else if (args[0].startsWith("<@&") && args[0].endsWith(">") && args[0].length==22) {
			// use role mention
			roleID = args[0].substring(3,21)
		} else if (args[0].length==18) {
			// use role id
			roleID = args[0]
		}
		
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

		if (roleID=="clear") specifiedRole = message.guild.roles.cache.get(vcrolestore.get(locID))
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
			else result = {success: true}
		}
		else result = {success: true}


		if (result.success) {

			// store the given info and tell the user it succeeded

			if (roleID=="clear") {
				vcrolestore.del(locID)
				resultMsg = `Voice channel role cleared successfully`
			} else {
				vcrolestore.set(locID, roleID)
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

	if (oldState.channelID!=null && newState.channelID==null) {
		action = "leave"
		channel = oldState.channel
	}
	else if (oldState.channelID==null && newState.channelID!=null) {
		action = "join"
		channel = newState.channel
	}
	else return

	const roleData = vcrolestore.get()
	const locations = Object.keys(roleData)

	if (locations.includes(channel.id)) {
		// use a channel location
		const roleID = roleData[channel.id]
		const role = channel.guild.roles.cache.get(roleID)
		if (action == "join") newState.member.roles.add(role)
		else if (action == "leave") newState.member.roles.remove(role)
	}

	if (locations.includes(channel.guild.id)) {
		// use a guild location
		const roleID = roleData[channel.guild.id]
		const role = channel.guild.roles.cache.get(roleID)
		if (action == "join") newState.member.roles.add(role)
		else if (action == "leave") newState.member.roles.remove(role)
	}
})


// webserver to keep alive
const server = express()
server.all("/keepalive", (req,res) => res.send("Bot woken"))
server.listen(3000, ()=>console.log("server running"))
