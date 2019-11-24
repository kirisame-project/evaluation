import { UserMediaOptions } from './utils/device'
import { RenderConfiguration } from './utils/render'
import { LambdaClientConfiguration } from './utils/lambda/client'
import { WebSocketConfiguration } from './websocket/client'

export default interface AppConfiguration {
    camera: UserMediaOptions
    lambda: LambdaClientConfiguration
    render: RenderConfiguration
    websocket: WebSocketConfiguration
}
