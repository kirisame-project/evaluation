import { UserMediaOptions } from './utils/device'
import { DirectServiceConfiguration } from './utils/direct'

export default interface AppConfiguration {
    camera: UserMediaOptions
    direct: DirectServiceConfiguration
}
