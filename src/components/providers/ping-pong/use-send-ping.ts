import { useCallback } from "react";
import { waitForTransactionReceipt } from "@wagmi/core";
import { pingPongAbi } from "@/lib/abi/ping-pong.abi";

import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useSwitchChain,
} from "wagmi";
import { config } from "@/lib/wagmi";
import { usePingPong } from "@/components/providers/ping-pong/ping-pong-provider";
import { useEquito } from "../equito/equito-provider";

const convertIntoByte64 = (address: `0x${string}`): { lower: `0x${string}`, upper: `0x${string}` } => ({ lower: `0x000000000000000000000000${address.slice(2)}`, upper: '0x0000000000000000000000000000000000000000000000000000000000000000' });

export const useSendPing = () => {
  const { from, to } = useEquito();
  const { address } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { pingFee, pingMessage } = usePingPong();

  const {
    data: hash,
    writeContractAsync,
    isPending,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    isError,
  } = useWaitForTransactionReceipt({
    hash,
    chainId: from.chain?.definition.id,
    query: {
      enabled: !!hash && from.chain?.definition.id !== undefined,
    },
  });

  const execute = useCallback(async () => {
    if (!address) throw new Error("No address found, please connect a wallet");
    if (!from.chain) throw new Error("No from chain found");
    if (!to.chain) throw new Error("No to chain found");
    if (pingFee.fee === undefined) {
      throw new Error("Fee not found");
    }
    if (pingMessage === undefined) {
      throw new Error("Ping message not found");
    }

    try {
      // make sure we are on the from chain
      await switchChainAsync({ chainId: from.chain.definition.id });

      const hash = await writeContractAsync({
        address: from.chain.pingPongContract,
        abi: pingPongAbi,
        functionName: "crossChainTransfer",
        value: pingFee.fee,
        chainId: from.chain.definition.id,
        args: [convertIntoByte64(address), BigInt(to.chain.chainSelector), BigInt(pingMessage)],
      });

      return await waitForTransactionReceipt(config, {
        hash,
        chainId: from.chain.definition.id,
      });
    } catch (error) {
      console.log({ error });
      throw new Error("Send ping failed");
    }
  }, [
    address,
    from.chain,
    to.chain,
    pingFee.fee,
    pingMessage,
    switchChainAsync,
    writeContractAsync,
  ]);

  return {
    isPending,
    isConfirming,
    isSuccess,
    isError,
    execute,
    reset,
  };
};


/* 
  [1002, 1003, 1005]
  ["0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06", "0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904", "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846"]
  [1,1,1]
  BNB :- 0x9A097D6BFeC1b0e5Af9Fe9b239453Bda442f59c9
  AVA :- 0x9D1784D078C58FCC915Fe7C136A315fBdA44a725
  POL :- 0xC390B8fd58cE41a0c527a99E09c8b4028aB1c3b6
  ["0x9A097D6BFeC1b0e5Af9Fe9b239453Bda442f59c9", "0xC390B8fd58cE41a0c527a99E09c8b4028aB1c3b6", "0x9D1784D078C58FCC915Fe7C136A315fBdA44a725"]
*/