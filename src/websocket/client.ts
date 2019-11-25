import * as uuid from 'uuid/v4'
import { RecognitionTask } from './contracts'

export interface WebSocketConfiguration {
    endpoint: string
    retry: number
}

interface Message {
    data: any
    op: number
}

interface CloseSession extends Message {
    code: number
    reason: string
    op: 1
}

interface Handshake extends Message {
    data: {
        agent: string
        clientId: string
    }
    op: 2
}

interface ServerHandshake extends Message {
    data: {
        serverId: string
        serverName: string
        sessionId: string
    }
    op: 2
}

interface ImageRequest extends Message {
    data: {
        contentLength: number
        contentType: string
    }
    op: 5
}

type WebSocketClientState = 'closed' | 'connected' | 'connecting' | 'ready'

export class WebSocketClient {
    public readonly clientId: string

    public readyState: WebSocketClientState

    public serverName: string

    public sessionId: string

    public ontaskupdate: (task: RecognitionTask) => void

    private readonly config: WebSocketConfiguration

    private socket: WebSocket

    public constructor(config: WebSocketConfiguration) {
        this.config = config
        this.clientId = uuid()
        this.connect()
    }

    private connect() {
        const socket = new WebSocket(this.config.endpoint)

        socket.addEventListener('close', (event) => {
            console.error(`WebSocket closed: ${event.code} ${event.reason}`)
            this.readyState = 'closed'
            setTimeout(() => this.connect(), this.config.retry)
        })

        socket.addEventListener('open', () => this.handshake())

        socket.addEventListener('message', (event) => {
            const close = JSON.parse(event.data) as CloseSession
            if (close.op !== 1) return

            console.error(`Server requested session closure: ${close.code} ${close.reason}`)
            socket.close(1000, 'Server requested closure')
        })

        this.socket = socket
        this.readyState = 'connecting'
    }

    private handshake() {
        this.socket.send(JSON.stringify({
            data: {
                agent: 'BrowserEvaluationClinet/0.2.0',
                clientId: this.clientId,
            },
            op: 2,
        } as Handshake))

        this.socket.addEventListener('message', (event) => {
            this.acceptSession(event)
        }, { once: true })
    }

    private acceptSession(event: MessageEvent) {
        const response = JSON.parse(event.data) as Message

        if (response.op !== 2) {
            console.error(`Server failed to complete handshake: ${response}`)
            this.socket.close(1006, 'Expecting handshake response')
            return
        }

        this.serverName = (response as ServerHandshake).data.serverName
        this.sessionId = (response as ServerHandshake).data.sessionId

        this.socket.addEventListener('message', (message) => this.handleMessage(message))

        this.readyState = 'ready'
    }

    private handleMessage(event: MessageEvent) {
        const message = JSON.parse(event.data) as Message

        if (message.op === 4) {
            const task = message.data as RecognitionTask
            this.ontaskupdate(task)
        }
    }

    public sendImageRequest(image: Blob) {
        if (this.readyState !== 'ready') return

        // send request message
        this.socket.send(JSON.stringify({
            data: {
                contentLength: image.size,
                contentType: image.type,
            },
            op: 5,
        } as ImageRequest))

        // send request body
        this.socket.send(image)
    }
}
