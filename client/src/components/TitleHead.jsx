import { motion } from 'motion/react';

export default function TitleHead({ children, ...props }) {
    const { title, description } = props;
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-2 xl:flex items-center justify-between"
        >
            <div className='space-y-1'>
                <h1 className="text-xl sm:text-2xl tracking-wide font-medium text-slate-700  uppercase">{title}</h1>
                <p className="text-gray-600">{description}</p>
            </div>
            {children}
        </motion.div>
    );
}