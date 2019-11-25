interface FacePosition {
    x1: number
    x2: number
    y1: number
    y2: number
}

interface FaceSearchResult {
    distance: number
    label: number
}

export interface RecognizedFace {
    _id: string
    position: FacePosition
    results: FaceSearchResult[]
    vector: number[]
}

interface BaseTask {
    start: string
    state: string
    time: number
}

export interface RecognitionTask extends BaseTask {
    faceCount: number
    faces: RecognizedFace

    detection: BaseTask
    search: BaseTask
    vector: BaseTask
}
