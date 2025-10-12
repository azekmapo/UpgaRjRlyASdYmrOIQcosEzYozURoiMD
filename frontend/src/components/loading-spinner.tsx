import { Loader } from "lucide-react"

const LoadingSpinner = () => {
  return (
    <>
    <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin w-6 h-6 text-orange-500" />
      </div>
    </>
  )
}

export default LoadingSpinner