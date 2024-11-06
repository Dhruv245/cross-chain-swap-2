import { Skeleton } from "./ui/skeleton"

const PageLoader = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <Skeleton className="h-80 w-96" />
    </div>
  )
}

export default PageLoader