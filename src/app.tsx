import React, { useRef, useEffect, useState } from 'react'

import AppConfiguration from './config'
import { WebSocketClient } from './websocket/client'
import { CaptureService } from './utils/capture'
import { UserMediaOptions } from './utils/device'
import { Renderer } from './utils/render'

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
    const { camera: cameraConfig, websocket: wsConfig, render: renderConfig } = config

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
        let shutdown = false

        /* configure rendering */

        const video = stream ? videoElement.current : undefined
        const renderer = new Renderer(canvas.current, video, renderConfig)

        let frameRate = 0

        function framer() {
            if (shutdown) return
            renderer.render()
            frameRate += 1
            setTimeout(() => framer(), 1)
        }

        function resetFrameRate() {
            if (shutdown) return
            renderer.setFrameRate(frameRate)
            frameRate = 0
            setTimeout(() => resetFrameRate(), 1000)
        }

        setImmediate(() => framer())
        setImmediate(() => resetFrameRate())

        /* configure networking */

        const capture = new CaptureService(videoElement.current)
        const client = new WebSocketClient(wsConfig)

        client.ontaskupdate = (task) => {
            renderer.serverName = client.serverName
            renderer.sessionId = client.sessionId

            if (task.taskSearch.state === 'Pending') renderer.stage1 = task
            if (task.taskSearch.state === 'Completed') renderer.stage2 = task

            setTimeout(() => {
                if (renderer.stage2 === task) {
                    renderer.stage2 = undefined
                }
            }, 2000)
        }

        async function requester() {
            const image = await capture.getBlob()
            await client.sendImageRequest(image)
            setTimeout(() => requester(), 500)
        }

        if (stream !== undefined) {
            setImmediate(() => requester())
        }

        return () => { shutdown = true }
    }, [wsConfig, renderConfig, stream, videoElement])

    return (
        <div className="app-main">
            <canvas className="render" ref={canvas} height="1080px" width="1920px" />
        </div>
    )
}
