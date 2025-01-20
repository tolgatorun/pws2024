const websocketMap = {}

module.exports = wsInstance => (ws, req) => {
    ws.sessionID = req.sessionID
    websocketMap[req.sessionID] = ws

    // Send a ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.ping()
        }
    }, 30000)

    ws.on('message', rawData => {
        let data = {}
        try {
            data = JSON.parse(rawData)
            
            // Handle chat messages
            if (data.to) {
                req.sessionStore.all((err, sessions) => {
                    if(err) {
                        console.error('Cannot retrieve sessions')
                        return
                    }
                    for(const sessionID in sessions) {
                        if(websocketMap[sessionID] // chat was opened or not
                           && sessions[sessionID].passport
                           && sessions[sessionID].passport.user
                           && sessions[sessionID].passport.user == data.to) {
                            try {
                                websocketMap[sessionID].send(JSON.stringify(data))
                            } catch(err) {
                                console.error('Websocket send error', err.message)
                            }
                        }
                    }
                })
            }
            // Handle other message types (like project updates)
            else if (data.type) {
                broadcastToAll(data)
            }
        } catch(err) {
            console.error('WebSocket message error:', err.message, rawData)
        }
    })

    ws.on('close', () => {
        clearInterval(pingInterval)
        delete websocketMap[ws.sessionID]
    })

    ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        clearInterval(pingInterval)
        delete websocketMap[ws.sessionID]
    })
}

// Function to broadcast messages to all connected clients
function broadcastToAll(data) {
    for (const sessionID in websocketMap) {
        const client = websocketMap[sessionID]
        if (client.readyState === client.OPEN) {
            try {
                client.send(JSON.stringify(data))
            } catch (err) {
                console.error('Broadcast error:', err.message)
            }
        }
    }
}

// Export the broadcast function for use in other modules
module.exports.broadcast = broadcastToAll