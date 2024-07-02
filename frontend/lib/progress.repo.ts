type ProgressData = {
  Event: string
  Identifier: string
  CurrentStep: number
  MaxSteps: number
  Message: string
}

export function listenToProgress(event: string, identifier: string, onProgress: (data: ProgressData) => void) {
  const eventSource = new EventSource(`http://localhost:3001/image-result/${event}/${identifier}`)
  eventSource.addEventListener("progress", e => onProgress(JSON.parse(e.data)))
  return new Promise((r) => {
    eventSource.onopen = () => r(undefined)
  })
}