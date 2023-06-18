const { createServer } = require('http')
const express = require('express')
const { Server } = require('socket.io')
const cors = require('cors')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.static(path.join(__dirname, './frontend/build/')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, './frontend/build/index.html')))
const server = createServer(app)

const PORT = process.env.PORT || 7004

const io = new Server(server, {
    cors: {
        origin: "/",
        methods: ["GET", "POST"]
    }
})
let socketsArr = []
let roomArr = []
io.on('connection', (socket) => {
    socket.on('userdata', data => {
        socket.join(data.room)
        !roomArr.includes(data.room) && roomArr.push(data.room)
        socketsArr.push({ ...data, id: socket.id })
        socket.emit('socketid', { id: socket.id })
        io.to(data.room).emit('roomMembersList', socketsArr.filter(x => x.room === data.room).map(x => ({ id: x.id, username: x.username })))
    })
    socket.on('sendMsg', message => {
        socket.to(message.room).emit('receiveMsg', { data: message.data, time: message.time, sender: message.sender })
    })
    socket.on('disconnect', () => {
        let obj = socketsArr.find(x => x.id === socket.id)
        socketsArr = socketsArr.filter(x => x.id !== socket.id)
        obj && io.to(obj.room).emit('roomMembersList', socketsArr.filter(x => x.room === obj.room).map(x => ({ id: x.id, username: x.username })))
    })
})



server.listen(PORT, () => console.log('Server running!'))