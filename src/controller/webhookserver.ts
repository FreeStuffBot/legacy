import * as express from 'express'
import { FreeStuffApiServerConfig } from '../types/config'
import { Core } from '../index'
import Logger from '../util/logger'


export default class WebhookServer {

  public static start(config: FreeStuffApiServerConfig) {
    if (!config) return
    if (!config.port) {
      config.port = 8080
      Logger.warn('Server enabled but no port specified. Server is now trying to launch on port 8080.')
    }
    if (!config.endpoint)
      config.endpoint = '/webhook'

    const app = express()
    app.set('trust proxy', 1)
    app.use(config.endpoint, express.json())
    app.use(config.endpoint, Core.fsapi.webhook())

    Core.fsapi.on('webhook_test', () => {
      Logger.process('Webhook test received!')
    })

    app.listen(config.port, undefined, () => {
      Logger.info(`Server launched. Configure your webhook url to point at https://[host]:${config.port}${config.endpoint}`)
    })
  }

}