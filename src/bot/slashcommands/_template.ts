import { Interaction, InteractionCommandHandler, InteractionReplyFunction } from '../../types/interactions'
import { GuildData } from '../../types/datastructs'


export default class NEW_TEMPLATE_COMMAND extends InteractionCommandHandler {

  public handle(_command: Interaction, _data: GuildData, reply: InteractionReplyFunction): boolean {
    reply('ChannelMessageWithSource', {
      title: '',
      description: ''
    })
    return true
  }

}
