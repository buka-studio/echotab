import { useCallback, useState } from 'react'

type CopyFn = (text: string) => Promise<boolean>

export function useCopyToClipboard({ timeout = 2000 }: { timeout?: number } = {}): [string | null, CopyFn] {
    const [copiedText, setCopiedText] = useState<string | null>(null)

    const copy: CopyFn = useCallback(
        async (text) => {
            if (!navigator?.clipboard) {
                return false
            }

            try {
                await navigator.clipboard.writeText(text)

                setCopiedText(text)

                if (timeout !== 0) {
                    setTimeout(() => {
                        setCopiedText(null)
                    }, timeout)
                }

                return true
            } catch (error) {
                setCopiedText(null)

                return false
            }
        },
        [timeout],
    )

    return [copiedText, copy]
}