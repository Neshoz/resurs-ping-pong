import { webApi } from "@slack/bolt";

type ChannelsResponse = Awaited<
  ReturnType<webApi.WebClient["users"]["conversations"]>
>;
type Channel = NonNullable<ChannelsResponse["channels"]>[number];

let _mainBotChannel: Channel | null = null;

export const mainBotChannel = {
  get: () => _mainBotChannel,
  set: (channel: Channel) => (_mainBotChannel = channel),
};
