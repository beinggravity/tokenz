export function defineAdapter(partial) {
  return {
    findComposeBox: () => null,
    findSendButton: () => null,
    findFileInputs: () => [],
    findDropZones: () => [],
    isGenerating: () => false,
    getPerMessageCharLimit: () => null,
    findLatestAssistantMessage: () => null,
    clickSend: () => { },
    ...partial,
  };
}

export function resolveAdapter(hostname, adapters) {
  const h = hostname.toLowerCase();
  return adapters.find((a) => a.hostPatterns.some((p) => h.includes(p))) ?? null;
}
