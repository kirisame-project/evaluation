export interface FacePosition {
    x1: number
    y1: number
    x2: number
    y2: number
}

export interface FaceSearchResult {
    distance: number
    label: number
}

export interface Face {
    id: string
    position: FacePosition
    vector: number[]
    searchResults: FaceSearchResult[]
}

export interface FaceSubTask {
    _time: string
    id: string
    state: string
}

export interface RecognitionTask {
    _time: string
    count: number
    faces: Face[]
    timestamp: string
    taskDetection: FaceSubTask
    taskVector: FaceSubTask
    taskSearch: FaceSubTask
}
