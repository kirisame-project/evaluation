import { UserMediaOptions } from './utils/device'
import { RenderConfiguration } from './utils/render'
import { WebSocketConfiguration } from './websocket/client'

export default interface AppConfiguration {
    camera: UserMediaOptions
    render: RenderConfiguration
    websocket: WebSocketConfiguration
}
