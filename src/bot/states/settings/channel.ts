import { GuildChannel, NewsChannel, TextChannel } from 'discord.js'
import { Core } from '../../../index'
import { GenericInteraction } from '../../../cordo/types/ibase'
import { ButtonStyle, ComponentType, InteractionComponentFlag } from '../../../cordo/types/iconst'
import { InteractionApplicationCommandCallbackData } from '../../../cordo/types/custom'
import Emojis from '../../emojis'
import Tracker from '../../tracker'
import { MessageComponentSelectOption } from '../../../cordo/types/icomponent'


const recommendedChannelRegex = /free|game|gaming|deal/i
const filterOutChannelRegex1 = /rules|meme|support/i
const filterOutChannelRegex2 = /log|help|selfies/i
const filterOutChannelRegex3 = /team|partner|suggestions/i
const highProbChannelRegex = /announcement|new|general|computer|play|important|feed|bot|commands/i

function isRecommended(i: GenericInteraction, c: GuildChannel) {
  return recommendedChannelRegex.test(c.name) || i.channel_id === c.id
}

export default function (i: GenericInteraction): InteractionApplicationCommandCallbackData {
  if (!i.guildData) return { title: 'An error occured' }
  Tracker.set(i.guildData, 'PAGE_DISCOVERED_SETTINGS_CHANGE_CHANNEL')

  let channelsFound = Core.guilds.resolve(i.guild_id).channels.cache.array()
    .filter(c => (c.type === 'text' || c.type === 'news')) as (TextChannel | NewsChannel)[]

  let youHaveTooManyChannelsStage = 0

  // ah dang list is too long, let's start filtering some out
  if (channelsFound.length > 24) {
    channelsFound = channelsFound.filter(c => !c.nsfw)
    youHaveTooManyChannelsStage++
  }
  if (channelsFound.length > 24) {
    channelsFound = channelsFound.filter(c => c.permissionsFor(Core.user).has('VIEW_CHANNEL'))
    youHaveTooManyChannelsStage++
  }
  if (channelsFound.length > 24) {
    channelsFound = channelsFound.filter(c => !filterOutChannelRegex1.test(c.name) || isRecommended(i, c))
    youHaveTooManyChannelsStage++
  }
  if (channelsFound.length > 24) {
    channelsFound = channelsFound.filter(c => !filterOutChannelRegex2.test(c.name) || isRecommended(i, c))
    youHaveTooManyChannelsStage++
  }
  if (channelsFound.length > 24) {
    channelsFound = channelsFound.filter(c => !filterOutChannelRegex3.test(c.name) || isRecommended(i, c))
    youHaveTooManyChannelsStage++
  }
  if (channelsFound.length > 24) {
    channelsFound = channelsFound.filter(c => highProbChannelRegex.test(c.name) || isRecommended(i, c))
    youHaveTooManyChannelsStage++
  }

  // TODO in some absurd szenario there might be over 25 channels but then one regex kills all of them => empty array => error

  const channels = channelsFound
    .sort((a, b) =>
      (isRecommended(i, a) ? -1000 : 0)
      - (isRecommended(i, b) ? -1000 : 0)
      + (a.position + a.parent.position * 100)
      - (b.position + b.parent.position * 100)
    )
    .slice(0, 24)
    .map((c) => {
      const p = c.permissionsFor(Core.user)
      let description = '' // (c as TextChannel).topic?.substr(0, 50) || ''
      if (!p.has('VIEW_CHANNEL')) description = '⚠️ Missing "View Channel" Permission'
      else if (!p.has('SEND_MESSAGES')) description = '⚠️ Missing "Send Messages" Permission'
      else if (!p.has('EMBED_LINKS')) description = 'Missing "Embed Messages" Permission'

      return {
        label: c.name.substr(0, 25),
        value: c.id,
        default: i.guildData.channel?.toString() === c.id,
        description,
        emoji: {
          id: (c.type === 'news')
            ? isRecommended(i, c)
              ? Emojis.announcementChannelGreen.id
              : Emojis.announcementChannel.id
            : isRecommended(i, c)
              ? Emojis.channelGreen.id
              : Emojis.channel.id
        }
      }
    })

  const options: MessageComponentSelectOption[] = [
    {
      label: 'No channel',
      value: '0',
      default: !i.guildData.channel || !i.guildData.channelInstance,
      description: 'Disable free games feed',
      emoji: { id: Emojis.no.id }
    },
    ...channels
  ]

  return {
    title: 'display',
    description: `OH MY GOD, youHaveTooManyChannelsStage: ${youHaveTooManyChannelsStage}`,
    components: [
      {
        type: ComponentType.SELECT,
        custom_id: 'settings_channel_change',
        options,
        placeholder: 'Pick a channel to send games to',
        flags: [ InteractionComponentFlag.ACCESS_MANAGE_SERVER ]
      },
      {
        type: ComponentType.BUTTON,
        style: ButtonStyle.SECONDARY,
        custom_id: 'settings_main',
        label: 'Back',
        emoji: { id: Emojis.caretLeft.id }
      }
    ]
  }
}
