import { DetectionResult } from './direct'

export class PlaybackController {
    private box: DetectionResult

    private readonly canvas: HTMLCanvasElement

    private readonly video: HTMLVideoElement

    public constructor(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
        this.box = {
            x1: 0, x2: 20, y1: 0, y2: 20,
        }
        this.canvas = canvas
        this.video = video
    }

    public setDetectionBox(box: DetectionResult) {
        this.box = box
    }

    public drawVideo() {
        const ctx = this.canvas.getContext('2d')

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        const { height, width } = ctx.canvas
        ctx.drawImage(this.video, 0, 0, width, height)

        ctx.font = '48px monospace'
        ctx.lineJoin = 'round'
        ctx.lineWidth = 10
        ctx.strokeStyle = 'white'
        ctx.strokeText(JSON.stringify(this.box), 0, 48)
        ctx.fillStyle = 'green'
        ctx.fillText(JSON.stringify(this.box), 0, 48)

        const {
            x1, x2, y1, y2,
        } = this.box
        ctx.lineJoin = 'round'
        ctx.lineWidth = 24
        ctx.strokeStyle = 'green'
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
    }
}
