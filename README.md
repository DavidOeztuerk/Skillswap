# Skillswap

SkillSwap ist eine Microservice-Plattform, auf der Nutzer ihre Kenntnisse
gegenseitig tauschen können. Die Anwendung besteht aus mehreren .NET 9
Services sowie einem React-Frontend. Alle Komponenten lassen sich über
`docker-compose` starten.

## Voraussetzungen

- [Docker](https://www.docker.com/) und Docker Compose müssen installiert sein.
- Für die lokalen Images werden keine weiteren Abhängigkeiten benötigt.

## Schnellstart

1. Repository klonen

   ```bash
   git clone https://example.com/skillswap.git
   cd Skillswap
   ```

2. Benötigte Umgebungsvariablen setzen (z.B. in einer `.env` Datei). Für ein
   lokales Setup reichen Beispielwerte:

   ```bash
   export JWT_SECRET=SuperSecret
   export JWT_ISSUER=Skillswap
   export JWT_AUDIENCE=Skillswap
   ```

3. Alle Services starten

   ```bash
   docker-compose up --build
   ```

   Der Gateway ist danach unter [http://localhost:8080](http://localhost:8080)
   erreichbar, das Frontend unter [http://localhost:3000](http://localhost:3000).

Damit ist die komplette Entwicklungsumgebung eingerichtet.
