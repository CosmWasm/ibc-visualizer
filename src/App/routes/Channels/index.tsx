import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useClient } from "../../../contexts/ClientContext";
import { IbcChannelsResponse, IbcConnectionChannelsResponse } from "../../../types/ibc";
import { ellideMiddle } from "../../../utils/strings";
import { HeightData } from "../../components/HeightData";
import { Navigation } from "../../components/Navigation";
import { pathChannel } from "../../paths";
import { style } from "../../style";
import { SelectConnectionId } from "./SelectConnectionId";

interface ChannelsParams {
  readonly connectionId?: string;
}

export function Channels(): JSX.Element {
  const { connectionId } = useParams<ChannelsParams>();
  const { getClient } = useClient();

  const [channelsResponse, setChannelsResponse] = useState<
    IbcChannelsResponse | IbcConnectionChannelsResponse
  >();

  useEffect(() => {
    (async function updateChannelsResponse() {
      if (connectionId) {
        const channelsResponse = await getClient().ibc.unverified.connectionChannels(connectionId);
        setChannelsResponse(channelsResponse);
      } else {
        const channelsResponse = await getClient().ibc.unverified.channels();
        setChannelsResponse(channelsResponse);
      }
    })();
  }, [connectionId, getClient]);

  async function loadMoreChannels(): Promise<void> {
    if (!channelsResponse?.pagination?.nextKey) return;

    const newChannelsResponse = await getClient().ibc.unverified.channels(
      channelsResponse.pagination.nextKey,
    );

    const oldChannels = channelsResponse.channels ?? [];
    const newChannels = newChannelsResponse.channels ?? [];

    setChannelsResponse({
      ...newChannelsResponse,
      channels: [...oldChannels, ...newChannels],
    });
  }

  return (
    <div className="container mx-auto">
      <Navigation />
      <div>
        <span className={style.title}>Channels</span>
        <SelectConnectionId connectionId={connectionId ?? ""} />
        {channelsResponse?.channels?.length ? (
          <>
            <HeightData height={channelsResponse.height} />
            <div className="flex flex-row flex-wrap">
              {channelsResponse.channels.map((channel, index) => (
                <Link
                  to={`${pathChannel}/${channel.portId}/${channel.channelId}`}
                  key={index}
                  className={style.button}
                >
                  <span>{`${ellideMiddle(channel.portId ?? "–", 20)} | ${ellideMiddle(
                    channel.channelId ?? "–",
                    20,
                  )}`}</span>
                </Link>
              ))}
            </div>
            {channelsResponse.pagination?.nextKey?.length ? (
              <button onClick={loadMoreChannels}>Load more</button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
