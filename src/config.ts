import { UserMediaOptions } from './utils/device'
import { DirectServiceConfiguration } from './utils/direct'
import { RenderConfiguration } from './utils/playback'

export default interface AppConfiguration {
    camera: UserMediaOptions
    direct: DirectServiceConfiguration
    render: RenderConfiguration
}
