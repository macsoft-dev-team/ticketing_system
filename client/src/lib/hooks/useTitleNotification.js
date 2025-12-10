import { useEffect, useRef } from "react";

export default function useTitleNotification(count) {
    const originalTitle = useRef(document.title);

    useEffect(() => {
        if (count > 0) {
            document.title = `${originalTitle.current} (${count}) `;
        } else {
            document.title = originalTitle.current;
        }
    }, [count]);
}
