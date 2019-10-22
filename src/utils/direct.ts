export interface DirectServiceConfiguration {
    endpoints: {
        detection: string
        recoginition: string
    }
}

export interface DetectionResult {
    x1: number
    x2: number
    y1: number
    y2: number
}

type DetectionResponse = number[]

export class DirectService {
    private readonly config: DirectServiceConfiguration

    public constructor(config: DirectServiceConfiguration) {
        this.config = config
    }

    public async requestDetection(image: Blob): Promise<DetectionResult> {
        try {
            const request = await fetch(this.config.endpoints.detection, {
                body: image,
                headers: {
                    'Content-Type': 'image/jpeg',
                },
                method: 'POST',
            })

            const response = await request.json()
            if (response.code !== '200') throw new Error('code != 200')

            const [x1, y1, x2, y2] = response.box
            return {
                x1: x1, x2: x2, y1: y1, y2: y2,
            }
        } catch (e) {
            console.error('Detection service failed: ', e)
            return {
                x1: 114, x2: 514, y1: 114, y2: 514,
            }
        }
    }
}
