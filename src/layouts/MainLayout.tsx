import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Link, Outlet } from "react-router-dom"
import { AppProvider } from "../components/providers/app-provider"
import { Toaster } from "sonner"
import { Suspense } from "react"
import PageLoader from "@/components/page-loader"


const MainLayout = () => {
    return (
        <AppProvider>
            <header className="w-full fixed flex items-center justify-between px-10 py-4 top-0 left-0 right-0">
                <div className="flex items-center h-full gap-x-3">
                    <h3 className="text-2xl tracking-tight font-bold">
                        <Link to="/">
                            CrossChain Swap
                        </Link>
                    </h3>
                    <nav className="flex gap-x-2">
                        <Link to="/faucet">Faucet</Link>
                        <Link to="/swap">Swap</Link>
                    </nav>
                </div>
                <ConnectButton
                    chainStatus={"icon"}
                    showBalance={false}
                    accountStatus={{
                        smallScreen: "avatar",
                        largeScreen: "full",
                    }}
                />
            </header>
            <div className="mt-16">
                <Suspense fallback={<PageLoader />}>
                    <Outlet />
                </Suspense>
            </div>
            <Toaster richColors />
        </AppProvider>
    )
}

export default MainLayout