export class CropService {
    private readonly canvas: HTMLCanvasElement

    public constructor() {
        this.canvas = document.createElement('canvas')
    }

    public async crop(blob: Blob, x: number, y: number, h: number, w: number): Promise<Blob> {
        if (h === 0 || w === 0) {
            return null
        }

        return new Promise((resolve) => {
            const image = new Image()
            image.onload = () => {
                this.canvas.height = h
                this.canvas.width = w

                const ctx = this.canvas.getContext('2d')
                ctx.drawImage(image, x, y, w, h, 0, 0, w, h)
                this.canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.5)
            }
            image.src = URL.createObjectURL(blob)
        })
    }
}
