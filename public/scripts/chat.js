$(function() {
    var currentUser;
    var socket = io.connect('https://chat--socketio.herokuapp.com')
    var sideBar = $('.sidebar')
    var messageInput = $('input[name="message"]')
    var messagesContainer = $('.messages-container')
    var splashScreen = $('.splash')
    var nameInput = $('input[name="name"]')
    var typingStatus = $('.status')
    var submitBtn = $('.submit-btn')
    var Users, Messages;

    var lastKeystroke = 0;
    var typingTimeout = 0;

    nameInput.on('change', (e) => {
        currentUser = {name: nameInput.val(), color: getRandColor()}
        socket.emit('new_user', currentUser)
        splashScreen.hide()
    })

    submitBtn.on('click', submitMessage)

    messageInput.on('keyup', (e) => {
        if (e.which === 13) {
            submitMessage()
            return
        }

        let now = new Date().getTime()
        let isTyping = e.keyCode !== 8 
        // Throttling
        if (now - lastKeystroke > 1000) {
            lastKeystroke = now;
            clearTimeout(typingTimeout)
            socket.emit('user_typing', {user: currentUser, isActive: true, isTyping: isTyping})
            typingTimeout = setTimeout(() => {
                socket.emit('user_typing', {user: currentUser, isActive: false, isTyping: isTyping})                
            }, 3000)
        }
    })

    socket.on('update_users', (users) => {
        sideBar.html('') 
        users.map(u => {
            listItem = getUserListItem(u);
            sideBar.append(listItem)
        })
        Users = users
    })

    socket.on('update_messages', (messages) => {
        messagesContainer.html('')
        messages.map(m => {
            messagesContainer.append(getMessageItem(m))
        })
        Messages = messages
    })

    socket.on('user_typing', updateTypingStatus)

    function submitMessage(e) {
        socket.emit('new_message', {
            user: currentUser, 
            text: messageInput.val(), 
            timestamp: new Date().getTime()
        })
        messageInput.val('')
    }

    function getRandColor() {
        let color = '#'
        for (let i = 0; i < 3; i++) {
            color+= Math.floor(Math.random() * 256).toString(16)
        }
        return color;
    }

    function getUserInitials(user) {
        let nameParts = user.name.split(/\s/)
        return nameParts.length > 1 ? 
            nameParts[0][0] + nameParts[1][0] 
            : nameParts[0].slice(0, 2)
    }

    function getUserAvatar(user) {
        return $(
            `<div class="avatar">
                ${getUserInitials(user)}
            </div>`
        ).css('background', user.color).prop('outerHTML')
    }

    function getUserListItem(user) {
        return $(
            `<div class="user-list-item">
                ${getUserAvatar(user)}
                <span class="name">${user.name}</span>
            </div>`
        ).prop('outerHTML')
    }

    function getMessageItem(msg) {
        let pad = str => str.length > 1 ? str : '0' + str
        let time = new Date(msg.timestamp);
        let hour = pad(`${time.getHours()}`)
        let minute = pad(`${time.getMinutes()}`)
        let formattedTime = hour + ':' + minute

        return $(
            `<div class="message-item">
                <div class="message-wrapper" style="background: ${msg.user.color + '10'}">
                    ${getUserAvatar(msg.user)}
                    <span class="text">${msg.text}</span>
                </div>
                <span class="message-time">${formattedTime}</span>
            </div>`
        ).prop('outerHTML')
    }

    function updateTypingStatus(data) {
        typingStatus.hide('fade', {}, 500, () => {
            typingStatus.html('')
        
            if (!data.isActive) {
                return
            }
            
            let message = ` ${data.user.name} is ${data.isTyping ? 'typing...' : 'erasing...'}`
            typingStatus.append($(
                `<i class="${data.isTyping ? 'lni-pencil' : 'lni-eraser'}"></i>
                <span>${message}</span>`
            ))
            typingStatus.show('fade')
        })
    }
})