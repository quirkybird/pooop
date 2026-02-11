import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      duration={1500}
      toastOptions={{
        classNames: {
          toast:
            'group toast bg-white text-gray-800 border border-gray-200 shadow-lg rounded-xl',
          description: 'text-gray-500',
          actionButton:
            'bg-pink text-white rounded-lg',
          cancelButton:
            'bg-gray-100 text-gray-600 rounded-lg',
        },
      }}
      {...props}
    />
  );
}
