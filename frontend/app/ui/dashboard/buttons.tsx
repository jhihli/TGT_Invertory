import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export function CreateProduct() {
  return (
    <Link
      href="/dashboard/create"
      className="flex items-center gap-2 px-4 py-2 font-medium text-white
        bg-blue-500 hover:bg-blue-600
        rounded-lg shadow-md
        transform transition-all duration-200 hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
        disabled:opacity-75"
    >
      <span className="hidden md:block">Create Product</span>
      <PlusIcon className="h-5 w-5" />
    </Link>
  );
}

export function UpdateInvoice({ id }: { id: string }) {
  return (
    <Link
      href="/dashboard/invoices"
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteInvoice({ id }: { id: string }) {
  return (
    <>
      <button type="submit" className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>
    </>
  );
}

// Export Button component
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
      variants: {
          variant: {
              default:
        "bg-primary text-primary-foreground shadow hover:bg-primary/90",
              destructive:
        "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
              outline:
        "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
              secondary:
        "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
              ghost: "hover:bg-accent hover:text-accent-foreground",
              link: "text-primary underline-offset-4 hover:underline",
          },
          size: {
              default: "h-9 px-4 py-2",
              sm: "h-8 rounded-md px-3 text-xs",
              lg: "h-10 rounded-md px-8",
              icon: "h-9 w-9",
          },
      },
      defaultVariants: {
          variant: "default",
          size: "default",
      },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };