import {useCallback, useRef, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";

const parseXhrResponse = (xhr: XMLHttpRequest) => {
  if(!xhr.responseText) return null
  if(xhr.getResponseHeader("Content-Type")?.includes("application/json")) {
    try {
      return JSON.parse(xhr.responseText)
    } catch {
      return xhr.responseText
    }
  }
  return xhr.responseText
}

export function VideoUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [responseFile, setResponseFile] = useState<string>()
  const [isLookingForFinalImage, setIsLookingForFinalImage] = useState(false)
  const [finalImage, setFinalImage] = useState<string>()
  const [size, setSize] = useState(1600)
  const [fromFrames, setFromFrames] = useState(-1)
  const [toFrames, setToFrames] = useState(-1)
  const [frameRate, setFrameRate] = useState(-1)

  const uploadFile = useCallback(async (file: File | null) => {
    if (!file) return
    const formData = new FormData()
    formData.append("video", file)

    const xhr = new XMLHttpRequest()

    const response = await new Promise<{filename: string}>((resolve, reject) => {
      xhr.addEventListener("readystatechange", () => {
        if(xhr.readyState !== 4) return;
        setIsUploading(false)

        const isError = xhr.status >= 400
        const isNotSuccess = xhr.status >= 300 || xhr.status < 200

        const response = parseXhrResponse(xhr)
        if(isError || isNotSuccess) {
          console.error("Failed to upload file", xhr.status, response)
          return;
        }

        resolve(response)
      })
      setProgress(0)
      xhr.addEventListener("progress", e => setProgress(e.loaded / e.total))
      xhr.addEventListener("error", e => console.error("Error uploading file", e))

      xhr.open("POST", "http://localhost:3001/file-upload", true)
      xhr.send(formData)
      setIsUploading(true)
    })

    setResponseFile(response.filename)
    setFile(null)
    if (!inputRef.current) return
    inputRef.current.value = ""
  }, [inputRef])

  const createLongTermExposure = useCallback(async () => {
    await fetch("http://localhost:3001/video-processor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({filename: responseFile, scale: size, fromFrame: fromFrames, toFrame: toFrames, frameRate: frameRate})
    })
    setIsLookingForFinalImage(true)
    fetch(`http://localhost:3001/image-result/${responseFile}`).then(res => res.json()).then(data => {
      setFinalImage(data.filename)
      setIsLookingForFinalImage(false)
    })
  }, [responseFile, size, fromFrames, toFrames, frameRate])

  return (
    <div className="flex flex-col gap-2">
      <input ref={e => inputRef.current = e} type="file" accept="video/quicktime" onChange={e => {
        if (!e.target.files) return
        setFile(e.target.files[0])
      }}/>
      {file && <video src={URL.createObjectURL(file)} controls/>}
      {!file && responseFile && <video src={`http://localhost:3001/file-upload/get/${responseFile}`} controls/>}
      <Button type="button" variant="outline" disabled={!file || isUploading} onClick={() => uploadFile(file)}>Upload{isUploading ? ` ${progress}%` : ""}</Button>
      <Label>Size</Label>
      <Input type="number" disabled={!responseFile} placeholder="Size" value={size} onChange={e => setSize(e.target.valueAsNumber)} />
      <Label>FrameRate</Label>
      <Input type="number" disabled={!responseFile} placeholder="FrameRate" value={frameRate} onChange={e => setFrameRate(e.target.valueAsNumber)} />
      <Label>FromFrame</Label>
      <Input type="number" disabled={!responseFile} placeholder="FromFrames" value={fromFrames} onChange={e => setFromFrames(e.target.valueAsNumber)} />
      <Label>ToFrame</Label>
      <Input type="number" disabled={!responseFile} placeholder="ToFrames" value={toFrames} onChange={e => setToFrames(e.target.valueAsNumber)} />
      <Button onClick={createLongTermExposure} disabled={!responseFile}>Create Long Term Exposure</Button>

      {isLookingForFinalImage && <p>Waiting for process to finish...</p>}
      {!isLookingForFinalImage && finalImage && <img src={`http://localhost:3001/file-upload/get/${finalImage}`} alt="test"/>}
    </div>
  )
}