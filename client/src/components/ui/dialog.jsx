import React, { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// Dialog context
const DialogContext = createContext();

export function Dialog({ open, onOpenChange, children }) {
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            {children}
        </DialogContext.Provider>
    );
}

export function DialogTrigger({ asChild, children }) {
    const { onOpenChange } = useContext(DialogContext);
    if (asChild) {
        // Clone the child and inject onClick for opening modal
        return React.cloneElement(children, {
            onClick: (e) => {
                if (children.props.onClick) children.props.onClick(e);
                onOpenChange(true);
            },
        });
    }
    return (
        <button onClick={() => onOpenChange(true)}>{children}</button>
    );
}

export function DialogContent({ className = "", children }) {
    const { open, onOpenChange } = useContext(DialogContext);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className={
                        "fixed inset-0 z-50 flex min-h-screen w-full min-w-full items-center justify-center " +
                        className
                    }
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/20 bg-opacity-60"
                        onClick={() => onOpenChange(false)}
                    />
                    {/* Modal Box */}
                    <motion.div
                        className="relative bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full z-10 max-h-[90vh] overflow-y-auto"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                    >
                        {children}
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            onClick={() => onOpenChange(false)}
                            aria-label="Close"
                        >
                           <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function DialogHeader({ className = "", children }) {
    return (
        <div className={"flex flex-col space-y-1.5 text-center sm:text-left " + className}>
            {children}
        </div>
    );
}

export function DialogTitle({ className = "", children }) {
    return (
        <h2 className={"text-lg font-semibold leading-none tracking-tight " + className}>
            {children}
        </h2>
    );
}

export function DialogFooter({ className = "", children }) {
    return (
        <div className={"flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 " + className}>
            {children}
        </div>
    );
}

export function DialogDescription({ className = "", children }) {
    return (
        <p className={"text-sm text-muted-foreground " + className}>
            {children}
        </p>
    );
}
