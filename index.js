const express = require("express")
const Discord = require("discord.js")
const store = require("data-store")({ path: process.cwd() + "/role-data.json" })
require("dotenv").config()

const client = new Discord.Client()

client.once ("ready", _ => {
	console.log("bot running"),
	client.user.setActivity("beatso.tk/project/schubert", {type:"WATCHING"})
})

client.login(process.env.bottoken)

// webserver to keep alive
const server = express()
server.all("/keepalive", (req,res) => res.send("Bot woken"))
server.listen(3000, ()=>console.log("server running"))
