import "@rainbow-me/rainbowkit/styles.css";
import { ChainCard } from "@/components/chain-card";
import { PingButton } from "../components/ping-button";

function App() {

  return (
    <main className="lg:h-screen h-full p-6 lg:p-0 w-full flex items-center justify-center antialiased bg-background">
      <div className="container flex flex-col w-full items-center gap-3">
        <div className="gap-2 flex flex-col items-center">
          <div className="flex justify-center items-center gap-2">
            <div className="text-4xl tracking-tight font-bold">
              CrossChain Swap
            </div>
          </div>
          <p className="text-muted-foreground">
            Swap tokens between multiple chains
          </p>
        </div>
        <div className="flex gap-3 flex-col items-center">
          <ChainCard mode="from" />
          <PingButton />
          <ChainCard mode="to" />
        </div>
      </div>
    </main>
  );
}

export default App;
