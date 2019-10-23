import React, { useRef, useEffect, useState } from 'react'

import AppConfiguration from './config'
import { CaptureService } from './utils/capture'
import { CropService } from './utils/crop'
import { UserMediaOptions } from './utils/device'
import { DirectService, DetectionResult } from './utils/direct'
import { PlaybackController } from './utils/playback'

import './app.css'

function createVideoElement(height: number, width: number) {
    const video = document.createElement('video')
    video.autoplay = true
    video.height = height
    video.width = width
    return video
}

async function openDeviceStream(options: UserMediaOptions, deviceId?: string) {
    const { frameRate, height, width } = options

    const constrians = {
        audio: false,
        video: { frameRate: frameRate, height: height, width: width },
    } as MediaStreamConstraints

    if (typeof deviceId === 'string' && deviceId.length > 0) {
        (constrians.video as MediaTrackConstraints).deviceId = deviceId
    }

    return navigator.mediaDevices.getUserMedia(constrians)
}

export function AppMain(props: {
    config: AppConfiguration
}) {
    const { config } = props
    const { camera: cameraConfig, direct: directConfig } = config

    const [stream, setStream] = useState<MediaStream>(undefined)

    const canvas = useRef<HTMLCanvasElement>()
    const cropService = useRef<CropService>(new CropService())
    const videoElement = useRef<HTMLVideoElement>(
        createVideoElement(cameraConfig.height, cameraConfig.width),
    )

    if (stream === undefined) {
        setStream(null)

        openDeviceStream(cameraConfig, undefined).then((newStream) => {
            if (newStream === stream) return

            if (newStream.getVideoTracks().length === 0) {
                throw new Error('Unexpected empty video stream')
            }

            console.info('Switching active stream to ', newStream)

            if (stream instanceof MediaStream) {
                stream.getVideoTracks().forEach((track) => track.stop())
            }

            setStream(newStream)
        }).catch((error) => {
            setStream(null)
            throw new Error(`Open device stream failed: ${error}`)
        })
    }

    if (videoElement.current.srcObject !== stream) {
        videoElement.current.srcObject = stream
    }

    useEffect(() => {
        const capture = new CaptureService(videoElement.current)
        const direct = new DirectService(directConfig)
        const playback = new PlaybackController(canvas.current, videoElement.current)

        let shutdown = false
        let hasActiveRecognition = false

        function framer() {
            if (shutdown) return
            playback.drawVideo()
            setTimeout(() => framer(), 25)
        }

        async function recognize(blob: Blob, box: DetectionResult) {
            hasActiveRecognition = true
            try {
                const {
                    x1, x2, y1, y2,
                } = box
                const h = y2 - y1
                const w = x2 - x1

                const crop = await cropService.current.crop(blob, x1, y1, h, w)
                if (crop === null) return

                const recognition = await direct.requestRecognition(crop)
                playback.setRecognitionResult(recognition)
            } finally {
                hasActiveRecognition = false
            }
        }

        async function requester() {
            if (shutdown) return

            try {
                const blob = await capture.getBlob()
                const result = await direct.requestDetection(blob)
                playback.setDetectionBox(result)

                if (!hasActiveRecognition) recognize(blob, result)
            } finally {
                setTimeout(() => requester(), 25)
            }
        }

        setImmediate(() => framer())
        setImmediate(() => requester())

        return () => {
            shutdown = true
        }
    }, [config, directConfig, videoElement])

    return (
        <div className="app-main">
            <canvas className="render" ref={canvas} height="1080px" width="1920px" />
        </div>
    )
}
