import { parseFrom, parseMessage } from '../lib/params'

// メッセージカード用の送り主名と自由メッセージ（未指定なら空文字）
export function useCardParams(): { from: string; message: string } {
  const search = window.location.search
  return { from: parseFrom(search), message: parseMessage(search) }
}
