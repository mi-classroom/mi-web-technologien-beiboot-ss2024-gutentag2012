export async function createProjectStack(filename: string, values: {
  scale: number,
  from: string,
  to: string,
  frameRate: number
}) {
  return fetch("http://localhost:3001/video-processor/stack", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...values,
      filename
    })
  }).then(async res => {
    if(!res.ok) {
      throw new Error(`Failed to create long term exposure ${JSON.stringify(await res.json())}`)
    }
  })
  // return new Promise((resolve, reject) => {
  //   fetch("http://localhost:3001/video-processor/stack", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json"
  //     },
  //     body: JSON.stringify({
  //       ...values,
  //       filename
  //     })
  //   }).then(async res => {
  //     if(!res.ok) {
  //       reject(`Failed to create long term exposure ${JSON.stringify(await res.json())}`)
  //     }
  //   }).catch(err => {
  //     console.log("Error", err)
  //     reject(err.message)
  //   })
  //   fetch(`http://localhost:3001/image-result/${filename}`).then(res => res.json()).then(data => {
  //     resolve(data)
  //   }).catch(err => {
  //     reject(err.message)
  //   })
  // })
}

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
} 

export async function createImageFromStack(project: string, stack: string, options: {frames: number[]}) {
  return fetch("http://localhost:3001/video-processor/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      project,
      stack,
      ...options
    })
  }).then(async res => {
    if(!res.ok) {
      throw new Error(`Failed to create long term exposure ${JSON.stringify(await res.json())}`)
    }
  })
}