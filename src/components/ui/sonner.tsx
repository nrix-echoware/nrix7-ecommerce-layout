import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        style: {
          backgroundColor: '#000000',
          color: '#ffffff',
          border: '1px solid #4b5563'
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-white/90",
          actionButton:
            "group-[.toast]:bg-gray-800 group-[.toast]:text-white group-[.toast]:border-gray-600",
          cancelButton:
            "group-[.toast]:bg-gray-800 group-[.toast]:text-white group-[.toast]:border-gray-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
