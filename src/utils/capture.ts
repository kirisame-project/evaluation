export class CaptureService {
    private canvas: HTMLCanvasElement

    private video: HTMLVideoElement

    public constructor(video: HTMLVideoElement) {
        this.canvas = document.createElement('canvas')
        this.canvas.height = video.height
        this.canvas.width = video.width
        this.video = video
    }

    public async getBlob(): Promise<Blob> {
        return new Promise((resolve) => {
            this.canvas.getContext('2d').drawImage(this.video, 0, 0)
            this.canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.75)
        })
    }
}
