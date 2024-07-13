FROM golang:1.22.2-alpine

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY *.go ./

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

FROM alpine:latest

RUN apk update
RUN apk upgrade
RUN apk add --no-cache ffmpeg

COPY --from=0 /app/main .

CMD ["./main"]