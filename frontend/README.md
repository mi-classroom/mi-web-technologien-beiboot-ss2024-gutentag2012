# Frontend

Dieses Projekt bildet das Frontend für die Anwendung. Es wurde mithilfe von NextJS erstellt und bietet die folgenden Routes:

- [`/`](./app/page.tsx): Übersicht aller Projekte + Möglichkeit zum Erstellen eines neuen Projekts
- [`/[project]`](./app/[project]/page.tsx): Detailansicht eines Projekts + Erstellung von Image Stacks + Erstellung von Long Term Exposure Videos

Die grobe Struktur des Projekts sieht wie folgt aus:

- [`/app`](./app): Enthält alle Routes
- [`/components`](./components): Enthält alle wiederverwendbaren Komponenten
- [`/lib`](./lib): Enthält alle Hilfsfunktionen sowie die API-Verbindung in repos
