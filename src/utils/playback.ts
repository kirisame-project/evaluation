import QRious from 'qrious'

import { DetectionResult, RecognitionResult } from './direct'

export class PlaybackController {
    private box: DetectionResult

    private readonly canvas: HTMLCanvasElement

    private qr: HTMLImageElement

    private searchResult: any

    private readonly video: HTMLVideoElement

    public constructor(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
        this.box = {
            x1: 0, x2: 20, y1: 0, y2: 20,
        }
        this.canvas = canvas
        this.qr = new Image()
        this.video = video
    }

    public setDetectionBox(box: DetectionResult) {
        this.box = box
    }

    public setRecognitionResult(result: RecognitionResult) {
        const data = result.map((bit) => bit.toFixed(2))
        const qr = new QRious()
        qr.set({
            backgroundAlpha: 0.5,
            foreground: 'green',
            padding: 0,
            size: 2048,
            value: JSON.stringify(data),
        })
        this.qr.src = qr.toDataURL()
    }

    public setSearchResult(result: any) {
        this.searchResult = result
    }

    public drawVideo() {
        const ctx = this.canvas.getContext('2d')

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        const { height, width } = ctx.canvas
        ctx.drawImage(this.video, 0, 0, width, height)

        const {
            x1, x2, y1, y2,
        } = this.box

        const posText = `(${x1}, ${y1}), (${x2}, ${y2})`
        ctx.textBaseline = 'top'
        ctx.font = '24px monospace'
        ctx.lineJoin = 'round'
        ctx.lineWidth = 10
        ctx.strokeStyle = 'white'
        ctx.strokeText(posText, x1, y2 + 16)
        ctx.fillStyle = 'green'
        ctx.fillText(posText, x1, y2 + 16)

        if (this.searchResult) {
            const searchText = JSON.stringify(this.searchResult)
            ctx.strokeText(searchText, x1, y2 + 48)
            ctx.fillText(searchText, x1, y2 + 48)
        }

        ctx.drawImage(this.qr, x2, y1, 128, 128)

        ctx.lineJoin = 'round'
        ctx.lineWidth = 24
        ctx.strokeStyle = 'green'
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
    }
}
