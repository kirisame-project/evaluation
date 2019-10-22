import React, { useRef, useEffect, useState } from 'react'

import AppConfiguration from './config'
import { CaptureService } from './utils/capture'
import { UserMediaOptions } from './utils/device'
import { DirectService } from './utils/direct'
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
        const currentCanvas = canvas.current

        const capture = new CaptureService(videoElement.current)
        const direct = new DirectService(directConfig)
        const playback = new PlaybackController(canvas.current, videoElement.current)

        const requestTimer = setInterval(async () => {
            const blob = await capture.getBlob()
            const result = await direct.requestDetection(blob)
            playback.setDetectionBox(result)
        }, 500)

        const drawTimer = setInterval(() => playback.drawVideo(), 50)

        const draw = () => playback.drawVideo()
        currentCanvas.addEventListener('resize', draw)

        return () => {
            clearInterval(requestTimer)
            clearInterval(drawTimer)
            currentCanvas.removeEventListener('resize', draw)
        }
    }, [config, directConfig, videoElement])

    return (
        <div className="app-main">
            <canvas className="render" ref={canvas} height="1080px" width="1920px" />
        </div>
    )
}
