import { RecognizedFace, RecognitionTask } from '../websocket/contracts'

export interface RenderConfiguration {
    threshold: number
}

export class Renderer {
    private readonly canvas: HTMLCanvasElement

    private readonly config: RenderConfiguration

    private frameRate: number

    public detection: RecognitionTask

    public search: RecognitionTask

    public serverName: string

    public sessionId: string

    private readonly video: HTMLVideoElement

    public constructor(canvas: HTMLCanvasElement, video: HTMLVideoElement,
        config: RenderConfiguration) {
        this.canvas = canvas
        this.video = video
        this.config = config
    }

    public setFrameRate(frameRate: number) {
        this.frameRate = frameRate
    }

    public static drawFaceBox(ctx: CanvasRenderingContext2D, face: RecognizedFace) {
        const {
            x1, x2, y1, y2,
        } = face.position
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
    }

    public static drawText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number) {
        const h = ctx.measureText('M').width * 1.5
        s.split('\n').forEach((line, i) => {
            ctx.strokeText(line, x, y + h * i)
            ctx.fillText(line, x, y + h * i)
        })
    }

    public render() {
        const ctx = this.canvas.getContext('2d')

        // configure properties
        ctx.textBaseline = 'top'
        ctx.lineJoin = 'round'
        ctx.lineWidth = 12

        if (this.video === undefined) {
            ctx.fillStyle = 'white'
            ctx.strokeStyle = 'red'
            Renderer.drawText(ctx, 'No active video device stream', 0, 0)
            return
        }

        // flush canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // draw camera
        const { height, width } = ctx.canvas
        ctx.drawImage(this.video, 0, 0, width, height)

        // draw stage 1 results
        if (this.detection && this.detection.faces instanceof Array) {
            this.detection.faces.forEach((face) => Renderer.drawFaceBox(ctx, face))
        }

        // draw stage 2 results
        if (this.search && this.search.faces instanceof Array) {
            ctx.strokeStyle = 'green'
            this.search.faces.forEach((face: RecognizedFace) => {
                const { label, distance } = face.results[0]
                ctx.strokeStyle = distance > 0.8
                    ? 'green' : 'red'

                const {
                    x1, x2, y1, y2,
                } = face.position
                Renderer.drawText(ctx, `[Face] (${x1} ${y1}) (${x2} ${y2}) => Label=${label}, Distance=${distance}`, x1, y2 + 10)
                Renderer.drawFaceBox(ctx, face)
            })
        }

        // draw stats
        ctx.font = '24px sans-serif'
        ctx.fillStyle = 'white'
        ctx.strokeStyle = 'grey'
        const stats = `
[Renderer] frameRate=${this.frameRate}
[Detection] ${this.detection ? this.detection.start : 'No recent response'}
[Detection] ${this.detection ? `Count=${this.detection.faceCount} Time=${JSON.stringify(this.detection.detection.time)}` : undefined}
[Search] ${this.search ? this.search.start : 'No recent response'}
[Search] ${this.search ? `Count=${this.search.faceCount} Time=${this.search.time}` : undefined}
[ServerName] ${this.serverName}
[SessionId] ${this.sessionId}
        `
        Renderer.drawText(ctx, stats, 0, 0)
    }
}
