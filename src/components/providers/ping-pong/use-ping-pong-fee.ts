import { NATIVE_ADDRESS } from "@/lib/chains";
import { routerAbi } from "@equito-sdk/evm";
import { useReadContract } from "wagmi";
import { EquitoState } from "../equito/equito-provider";

type UsePingPongFeeArgs = {
  equito: EquitoState;
};

export const usePingPongFee = ({
  equito: {
    chain,
    router: { data: routerAddress },
  },
}: UsePingPongFeeArgs) => {
  const { data: fee, ...rest } = useReadContract({
    address: routerAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [chain?.pingPongContract || NATIVE_ADDRESS],
    query: {
      enabled: !!chain && !!routerAddress,
    },
    chainId: chain?.definition.id,
  });

  return {
    fee,
    ...rest,
  };
};
