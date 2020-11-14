const Discord = require("discord.js")
require("dotenv").config()

const client = new Discord.Client()

client.once ("ready", _ => {
	console.log("bot running"),
	client.user.setActivity("beatso.tk/project/schubert", {type:"WATCHING"})
})

client.login(process.env.bottoken)
