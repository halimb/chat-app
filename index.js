const express = require('express')
const app = express()

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))
app.get('/', (req, res) => {
    res.render('index')
})

server = app.listen(3000)

//------------------------------------

const io = require('socket.io')(server)
var Users = []
var Messages = []
var allClients = [];

io.on('connection', (socket) => {
    allClients.push(socket)

    socket.on('disconnect', () => {
        var index = allClients.indexOf(socket)
        allClients.splice(index, 1)

        for (var i = 0; i < Users.length; i++) {
            if (Users[i].name === socket.user.name) {
                break
            };
        }
        Users.splice(i, 1)

        socket.broadcast.emit('update_users', Users)
        socket.broadcast.emit('user_typing', {user: socket.user, isActive: false})
    });

    socket.on('new_user', (user) => {
        Users.push(user)
        socket.user = user
        socket.emit('update_users', Users)
        socket.broadcast.emit('update_users', Users)
        socket.emit('update_messages', Messages)
        socket.broadcast.emit('update_messages', Messages)
    })
    socket.on('change_username', (data) => {
        socket.username = data.username
    })
    socket.on('new_message', (msg) => {
        Messages.push(msg)
        socket.emit('update_messages', Messages)
        socket.broadcast.emit('update_messages', Messages)
    })
    socket.on('user_typing', (data) => {
        socket.broadcast.emit('user_typing', data)
    })
})