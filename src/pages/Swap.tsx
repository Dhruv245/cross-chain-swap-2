'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AMMAbi, AMMAddress } from '@/lib/abi/amm.abi'
import { toast } from "sonner"
import { useAccount, useWriteContract, useSwitchChain } from 'wagmi'
import { parseEther } from 'viem'
import { waitForTransactionReceipt } from '@wagmi/core'
import { config } from '@/lib/wagmi'
import { sepolia } from 'viem/chains'

export default function EthToMytSwap() {
    const { chainId, } = useAccount()
    const [ethAmount, setEthAmount] = useState('')
    const [mytAmount, setMytAmount] = useState('')
    const [exchangeRate,] = useState(1000)
    const [isLoading, setIsLoading] = useState(false)

    const { switchChainAsync } = useSwitchChain()

    useEffect(() => {
        (async () => {
            try {   
                if (chainId !== sepolia.id) {
                    // refetch()
                    await switchChainAsync({ chainId: sepolia.id })
                }
            } catch (error) {
                toast.warning("Switch to sepolia network")
            }
        })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainId])


    const { writeContractAsync } = useWriteContract()

    const handleEthAmountChange = (value: string) => {
       
        setEthAmount(value)
        const eth = parseFloat(value)
        if (!isNaN(eth)) {
            setMytAmount((eth * exchangeRate).toFixed(2))
        } else {
            setMytAmount('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const amount = parseFloat(ethAmount);
        if (amount < 0.001) {
            return toast.warning('Amount must be greater than 0.001')
        }
        setIsLoading(true)

        const handleSwap = async () => {
            const hash = await writeContractAsync({
                abi: AMMAbi,
                address: AMMAddress,
                functionName: 'swapEthForMYT',
                args: [],
                value: parseEther(ethAmount),
            })

            await waitForTransactionReceipt(config, {
                hash,
                confirmations: 3,
            })
            // await refetch();
        }

        toast.promise(handleSwap(), {
            loading: "Swapping ETH for MYT...",
            success() {

                return "Swap successful!"
            },
            error: "Swap failed",
            finally() {
                setIsLoading(false)
            }
        })
    }

    return (
        <div className='h-screen flex justify-center items-center'>
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Swap ETH for MYT</CardTitle>
                    <CardDescription>Enter the amount of ETH you want to swap for MYT tokens.</CardDescription>
                    {chainId !== sepolia.id && <CardDescription className='text-destructive font-semibold'>Switch to Sepolia network.</CardDescription>}
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="ethAmount">ETH Amount</Label>
                                <Input
                                    id="ethAmount"
                                    placeholder="Enter ETH amount"
                                    type="number"
                                    step="0.01"
                                    value={ethAmount}
                                    onChange={(e) => handleEthAmountChange(e.target.value)}
                                    min={1 / exchangeRate}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="mytAmount">MYT Amount (Estimated)</Label>
                                <Input
                                    id="mytAmount"
                                    value={mytAmount}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label>Exchange Rate</Label>
                                <p className="text-sm">1 ETH = {exchangeRate} MYT</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => { setEthAmount(''); setMytAmount('') }}>Reset</Button>
                        <Button
                            type="submit"
                            disabled={!ethAmount || isLoading || (chainId !== sepolia.id)}
                        >
                            {isLoading ? "Processing..." : "Swap ETH for MYT"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}