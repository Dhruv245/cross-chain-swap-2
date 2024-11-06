import { useMutation } from "@tanstack/react-query";
import { getBlock } from "@wagmi/core";
import { useSendPing } from "./use-send-ping";
import { config } from "@/lib/wagmi";
import { useApprove } from "../equito/use-approve";
import { useDeliver } from "../equito/use-deliver";
import { decodeAbiParameters, parseAbiParameters, parseEventLogs } from "viem";
import { routerAbi } from "@equito-sdk/evm";
import { generateHash } from "@equito-sdk/viem";
import { usePingPong } from "@/components/providers/ping-pong/ping-pong-provider";
import { useEquito } from "../equito/equito-provider";
import { useSwitchChain } from "wagmi";

export const useExecutePingPong = () => {
  const { from, to } = useEquito();
  const approve = useApprove();
  const { setPongMessage, setStatus, pongFee } = usePingPong();
  const { switchChainAsync } = useSwitchChain()
  const sendPing = useSendPing();

  const deliverPingAndSendPong = useDeliver({
    equito: to,
  });

  const {
    mutateAsync: execute,
    isError,
    isPending,
    isSuccess,
    error,
  } = useMutation({
    mutationFn: async () => {
      try {
        setPongMessage(undefined);

        if (!from.chain) {
          throw new Error("No from chain found");
        }

        if (!to.chain) {
          throw new Error("No to chain found");
        }

        if (pongFee.fee === undefined) {
          throw new Error("No fee found");
        }

        // start from 'from' chain
        setStatus("isSendingPing");
        const sendPingReceipt = await sendPing.execute();

        const sentPingMessage = parseEventLogs({
          abi: routerAbi,
          logs: sendPingReceipt.logs,
        }).flatMap(({ eventName, args }) =>
          eventName === "MessageSendRequested" ? [args] : []
        )[0];

        if (!sentPingMessage) {
          throw new Error("MessageSendRequested event not found");
        }

        const { timestamp: sentPingTimestamp } = await getBlock(config, {
          chainId: from.chain.definition.id,
          blockNumber: sendPingReceipt.blockNumber,
        });

        setStatus("isApprovingSentPing");
        const { proof: sentPingProof } = await approve.execute({
          messageHash: generateHash(sentPingMessage.message),
          fromTimestamp: Number(sentPingTimestamp) * 1000,
          chainSelector: from.chain.chainSelector,
        });

        // switch to 'to' chain
        setStatus("isDeliveringPingAndSendingPong");
        const deliverPingAndSendPongReceipt =
          await deliverPingAndSendPong.execute(
            sentPingProof,
            sentPingMessage.message,
            sentPingMessage.messageData,
            pongFee.fee
          );

        const sentPongMessage = parseEventLogs({
          abi: routerAbi,
          logs: deliverPingAndSendPongReceipt.logs,
        }).flatMap(({ eventName, args }) =>
          eventName === "MessageSendRequested" ? [args] : []
        )[0];

        if (!sentPongMessage) {
          throw new Error("MessageSendRequested event not found");
        }

        const [, pong] = decodeAbiParameters(
          parseAbiParameters("string, uint256"),
          sentPongMessage.messageData
        );


        setPongMessage(pong.toString());

        const { timestamp: sentPongTimestamp } = await getBlock(config, {
          chainId: to.chain.definition.id,
          blockNumber: deliverPingAndSendPongReceipt.blockNumber,
        });

        setStatus("isApprovingSentPong");
        await approve.execute({
          messageHash: generateHash(sentPongMessage.message),
          fromTimestamp: Number(sentPongTimestamp) * 1000,
          chainSelector: to.chain.chainSelector,
        });

        // back to 'from' chain
        setStatus("isDeliveringPong");
        // await deliverPong.execute(
        //   sentPongProof,
        //   sentPongMessage.message,
        //   sentPongMessage.messageData,
        //   pongFee.fee
        // );
        setTimeout(async () => {
          await switchChainAsync({ chainId: from.chain?.definition?.id ?? 0 })
          setStatus("isSuccess");
        }, 5000)
      } catch (error) {
        setStatus("isError");
        throw error;
      }
    },
  });

  return {
    execute,
    isPending,
    isSuccess,
    isError,
    error,
    ops: { sendPing, approve },
  };
};
