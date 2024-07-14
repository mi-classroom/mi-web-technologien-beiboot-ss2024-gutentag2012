# Backend

Dieses Projekt bildet das zentrale Backend für die Anwendung. Es wurde mithilfe von NestJS erstellt und bietet die folgenden Endpoints:

- [`/file-upload`](./src/file-upload/file-upload.controller.ts): Upload von Dateien + Listing aller Dateien
- [`/image-result`](./src/image-result/image-result.controller.ts): Verwaltung von Fortschritt der Verarbeitung durch Go Service
- [`/projects`](./src/projects/projects.controller.ts): Verwaltung von Projekten
- [`/video-processor`](./src/video-processor/video-processor.controller.ts): Anbindung zum Triggern der Videoverarbeitung im Go Service

Generell ist das Backend primär für die Anbindung zum Minio für das Speichern der Dateien und RabbitMQ für die Kommunikation zum Go Service zuständig.
