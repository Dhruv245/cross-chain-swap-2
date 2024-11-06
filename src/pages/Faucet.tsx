'use client'

import { useMemo, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { pingPongAbi } from '../lib/abi/ping-pong.abi'
import { chains } from '../lib/chains'
import { waitForTransactionReceipt } from '@wagmi/core'
import { config } from '../lib/wagmi'

export default function FaucetForm() {
    const { address: walletAddress, chainId } = useAccount()
    const [isLoading, setIsLoading] = useState(false);
    const contractAddress = useMemo(() => chains.find((chain) => chain.definition.id === chainId)?.pingPongContract, [chainId])

    const { data: userBalance, refetch: refetchUserBalance } = useReadContract({
        abi: pingPongAbi,
        address: contractAddress,
        functionName: 'balanceOf',
        args: [walletAddress!]
    })

    const { data: contractBalance, refetch: refetchContractBalance } = useReadContract({
        abi: pingPongAbi,
        address: contractAddress,
        functionName: 'balanceOf',
        args: [contractAddress!]
    })

    const { writeContractAsync } = useWriteContract()


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!contractAddress || !walletAddress) {
            return
        }

        const execute = async () => {
            setIsLoading(true)
            const hash = await writeContractAsync({
                abi: pingPongAbi,
                address: contractAddress,
                functionName: 'transferToken',
                args: []
            })

            await waitForTransactionReceipt(config, {
                hash,
                confirmations: 3,
            })

            await refetchContractBalance();
            await refetchUserBalance();
        }

        toast.promise(execute(), {
            success: (
                <>
                    <h6>Request Successful</h6>
                    <p>5 MYT has been sent to your wallet.</p>
                </>
            ),
            loading: (
                <>
                    <h6>Transaction Pending</h6>
                    {/* <p>5 MYT has been sent to your wallet.</p> */}
                </>
            ),
            error(error) {
                let message = "";
                if (error?.message?.includes('Withdraw Cooldown')) {
                    message = ("Cooldown period isn't over, wait for 5 hours since last transaction")
                } else {
                    message = "Something went wrong"
                }
                return (
                    <>
                        <h6>{message}</h6>
                        {/* <p>5 MYT has been sent to your wallet.</p> */}
                    </>
                )
            },
            finally() {
                setIsLoading(false)
            },
        })
    }

    return (
        <div className='h-screen w-full flex justify-center items-center'>
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>MYT Token Faucet</CardTitle>
                    <CardDescription>You can take atleast 5 tokens at a time</CardDescription>
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex items-end justify-between space-y-1.5">
                                <Label className='text-base'>Available Amount</Label>
                                <p className="text-2xl font-bold">{contractBalance?.toString() || "..."} MYT</p>
                            </div>
                            <div className="flex items-end justify-between space-y-1.5">
                                <Label className='text-base'>Your balance</Label>
                                <p className="text-xl font-bold">{userBalance?.toString() || "..."} MYT</p>
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={!walletAddress || isLoading}
                        className='flex-1'
                    >
                        Request Tokens
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}