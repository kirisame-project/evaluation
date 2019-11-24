import { v4 as uuidv4 } from 'uuid'

export interface LabmdaPosition {
    x1: number
    x2: number
    y1: number
    y2: number
}

export interface LambdaSearchResult {
    distance: number
    label: number
}

export interface LambdaFace {
    id: string
    position: LabmdaPosition
    searchResults: LambdaSearchResult[]
    vector: number[]
}

export interface LambdaSubTask {
    _time: number
    state: 'Pending' | 'Completed'
}

export interface LambdaTask {
    count: number
    faces: LambdaFace[]
    taskDetection: LambdaSubTask
    taskSearch: LambdaSubTask
    timestamp: string
    _time: number
}

export interface LambdaMessage {
    op: number
}

export interface LambdaTaskUpdate extends LambdaMessage {
    data: LambdaTask
}

export interface LambdaClientHandshake extends LambdaMessage {
    data: {
        id: string
        name: string
    }
}

export interface LambdaServerHandshake extends LambdaMessage {
    data: {
        serverId: string
        serverName: string
        sessionId: string
    }
}

export interface LambdaStandardResponse extends LambdaTask { }

export interface LambdaClientConfiguration {
    httpEndpoint: string
    wsEndpoint: string
}

const OPERATION_HANDSHAKE = 2
const OPERATION_TASK_UPDATED = 4

class LambdaWebSocket {
    public onconnected: (sessionId) => void

    public onclosed: () => void

    public onupdate: (task: LambdaTask) => void

    private socket: WebSocket

    public constructor(endpoint: string) {
        this.socket = new WebSocket(endpoint)
        this.socket.addEventListener('close', () => this.onclosed())
        this.socket.addEventListener('open', () => this.handshake())
    }

    public handshake() {
        this.socket.send(JSON.stringify({
            data: {
                id: uuidv4(),
                name: 'evaluation-client',
            },
            op: OPERATION_HANDSHAKE,
        } as LambdaClientHandshake))
        this.socket.addEventListener('message', (event) => this.handleHandshake(event), { once: true })
    }

    private handleHandshake(event: MessageEvent) {
        const handshake = JSON.parse(event.data) as LambdaServerHandshake
        this.onconnected(handshake.data.sessionId)
        this.socket.addEventListener('message', (ev) => this.handleMessage(ev))
    }

    private handleMessage(event: MessageEvent) {
        const message = JSON.parse(event.data)
        switch (message.op) {
            case OPERATION_TASK_UPDATED:
                this.onupdate((message as LambdaTaskUpdate).data)
                break
            default:
                console.error('Message handling not implemeted')
                break
        }
    }
}

export class LambdaClient {
    private config: LambdaClientConfiguration

    public currentSessionId: string

    public onupdate: (task: LambdaTask) => void

    public constructor(config: LambdaClientConfiguration) {
        this.config = config
        this.connect()
    }

    private connect() {
        console.log(`Trying WebSocket connection to ${this.config.wsEndpoint}`)
        const socket = new LambdaWebSocket(this.config.wsEndpoint)
        socket.onclosed = () => {
            this.currentSessionId = undefined
            this.connect()
        }
        socket.onconnected = (sessionId) => { this.currentSessionId = sessionId }
        socket.onupdate = (task) => this.onupdate(task)
    }

    public async commit(image: Blob) {
        if (!this.currentSessionId) throw new Error('WebSocket not connected')

        const request = await fetch(this.config.httpEndpoint, {
            body: image,
            headers: {
                'Content-Type': 'image/jpeg',
                'X-WebSocket-Session-Id': this.currentSessionId,
            },
            method: 'POST',
        })
        if (!request.ok) throw new Error(`Fetch failed: ${request.status} ${request.statusText}`)
        return (await request.json()) as LambdaStandardResponse
    }
}
