export async function createStack(values: {
  scale: number
  from: string
  to: string
  frameRate: number
  filename?: string
}): Promise<void> {
  return fetch("http://localhost:3001/video-processor/stack", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  }).then(async res => {
    if(!res.ok) {
      throw new Error(`Failed to create long term exposure ${JSON.stringify(await res.json())}`)
    }
  })
}

export async function getFilesInStack(project: string, stackName: string) {
  return fetch(`http://localhost:3001/file-upload/list/${project + encodeURIComponent("/") + stackName}`).then(res => res.json()).then(res => res.map((file: { name?: string; lastModified?: string; size: number; prefix?: string; }) => ({
    ...file,
    lastModified: file.lastModified && new Date(file.lastModified)
  })))
}

export async function createImageFromStack(values: {
  project: string
  stack: string
  frames: number[]
  weights: number[]
}) {
  return fetch("http://localhost:3001/video-processor/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  }).then(async res => {
    if (!res.ok) {
      throw new Error(`Failed to create long term exposure ${JSON.stringify(await res.json())}`)
    }
  })
}