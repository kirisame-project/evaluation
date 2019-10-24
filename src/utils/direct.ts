export interface DirectServiceConfiguration {
    endpoints: {
        detection: string
        recognition: string
        search: string
    }
}

export interface DetectionResult {
    x1: number
    x2: number
    y1: number
    y2: number
}

type DetectionResponse = number[]

export type RecognitionResult = number[]

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
                x1: 0, x2: 0, y1: 0, y2: 0,
            }
        }
    }

    public async requestRecognition(image: Blob): Promise<RecognitionResult> {
        try {
            const request = await fetch(this.config.endpoints.recognition, {
                body: image,
                headers: {
                    'Content-Type': 'image/jpeg',
                },
                method: 'POST',
            })

            const response = await request.json()
            if (!(response instanceof Array)) throw new Error('non-array result')

            return response[0]
        } catch (e) {
            console.error('Recognition service failed: ', e)
            return [0]
        }
    }

    public async requestSearch(vector: number[]) {
        const body = {
            count: 1,
            topk: 3,
            vectors: { "nekomimi": vector },
        }

        try {
            const request = await fetch(this.config.endpoints.search, {
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            })

            const response = await request.json()
            if (response.code !== 200) throw new Error('code != 200')

            return response.result['nekomimi']
        } catch (e) {
            console.error('Search service failed: ', e)
        }
    }
}
