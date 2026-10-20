// Which report / block menu a tap on a chat message opens (Apple guideline 1.2): the group menu, the one for a private chat, or none.
export function messageMenuKind(input: { demo: boolean; isGroup: boolean; fromMe: boolean }): 'group' | 'direct' | null {
  if (input.demo || input.fromMe) return null;
  return input.isGroup ? 'group' : 'direct';
}
