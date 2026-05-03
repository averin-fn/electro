# Электро — приложение для составления смет

Веб-приложение для электромонтажников: позволяет быстро составить смету
из каталога видов работ и экспортировать её в Excel. Каталог редактируется
прямо из интерфейса и хранится на сервере.

- Клиент: **React 18 + Vite**, без сторонних UI-библиотек, чистый CSS с
  CSS-переменными, светлая и тёмная тема.
- Сервер: **Node.js 18+ (Express)** + файловое JSON-хранилище.
- Адаптивный лейаут: одна колонка на мобильных, две — на ПК
  (слева — добавление, справа — список).
- Экспорт в XLSX через `exceljs`.

> Документация по коду — в файле [DOCS.md](DOCS.md).

---

## Содержание

1. [Возможности](#возможности)
2. [Структура репозитория](#структура-репозитория)
3. [Локальный запуск (разработка)](#локальный-запуск-разработка)
4. [Production-сборка](#production-сборка)
5. [Деплой на сервер](#деплой-на-сервер)
6. [GitHub Actions](#github-actions)
7. [Переменные окружения](#переменные-окружения)
8. [Бэкап и восстановление](#бэкап-и-восстановление)
9. [Скрипты npm](#скрипты-npm)
10. [Обновление (rolling update)](#обновление-rolling-update)

---

## Возможности

- Добавление позиций в смету: вид работы → материал → размер → количество.
- Автоматический подсчёт стоимости и итога.
- Экспорт сметы в `.xlsx` одним кликом.
- Светлая / тёмная тема (запоминается в `localStorage`).
- Редактирование каталога (CRUD) прямо из UI; данные сохраняются на сервере.
- Автоматический бэкап JSON-хранилища перед каждым деплоем.

## Структура репозитория

```
electro/
├── client/                 # React + Vite SPA
│   ├── src/
│   │   ├── components/     # AddWorkPanel, EstimateList, CatalogEditor, ThemeToggle
│   │   ├── utils/excel.js  # экспорт в XLSX
│   │   ├── api.js          # клиент REST API
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── server/                 # Express API
│   ├── src/
│   │   ├── routes/works.js # CRUD каталога
│   │   ├── storage.js      # файловое хранилище
│   │   └── index.js
│   └── data/
│       ├── works.seed.json # стартовые данные
│       └── works.json      # рабочее хранилище (создаётся при первом запуске)
├── scripts/                # backup / start / deploy / systemd unit
├── .github/workflows/      # CI/CD pipelines
└── package.json            # workspaces + общие команды
```

## Локальный запуск (разработка)

Требуется **Node.js 18+** и **npm 9+**.

```bash
git clone <url>
cd electro
npm install --workspaces --include-workspace-root
npm run dev
```

`npm run dev` поднимает одновременно:

- сервер на `http://localhost:4000`,
- клиент Vite на `http://localhost:5173` (запросы к `/api` проксируются на сервер).

Откройте `http://localhost:5173`.

### Запуск частей по отдельности

```bash
npm run dev:server     # только Express с auto-reload (--watch)
npm run dev:client     # только Vite
```

## Production-сборка

```bash
npm run build          # собирает client/dist
npm run start          # запускает Express, который раздаёт client/dist
```

Сервер автоматически отдаёт `client/dist` если папка существует —
дополнительный nginx не обязателен, но рекомендован для TLS.

Готовый скрипт «всё-в-одном»:

```bash
# Linux/macOS
./scripts/start.sh

# Windows
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1
```

## Деплой на сервер

Один из способов — systemd + git pull. Коротко:

1. Установите Node.js 18+ и git на сервер.
2. Создайте пользователя и директорию приложения:
   ```bash
   sudo useradd -r -m -d /opt/electro electro
   sudo -u electro git clone <url> /opt/electro
   ```
3. Установите unit-файл systemd:
   ```bash
   sudo cp /opt/electro/scripts/electro.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now electro
   ```
4. Первичная сборка:
   ```bash
   cd /opt/electro
   npm install --workspaces --include-workspace-root --omit=dev
   npm run build
   sudo systemctl restart electro
   ```
5. Поставьте перед сервером nginx/caddy с HTTPS — он должен проксировать
   запросы на `127.0.0.1:4000`.

Для последующих обновлений используйте:

```bash
cd /opt/electro
./scripts/deploy.sh
```

Скрипт `deploy.sh`:
1. делает бэкап `server/data/works.json`,
2. делает `git fetch && git reset --hard origin/main`,
3. ставит зависимости и собирает клиент,
4. перезапускает systemd-сервис.

## GitHub Actions

Файл `.github/workflows/deploy.yml`:

- собирает клиент при каждом push,
- при пуше в `main` подключается по SSH к серверу и вызывает
  `scripts/deploy.sh`.

Настройте в репозитории следующие **secrets**:

| Имя              | Описание                                            |
| ---------------- | --------------------------------------------------- |
| `SSH_HOST`       | адрес сервера                                       |
| `SSH_PORT`       | порт SSH (по умолчанию `22`)                        |
| `SSH_USER`       | SSH-пользователь                                    |
| `SSH_PRIVATE_KEY`| приватный ключ (PEM, без пароля)                    |
| `APP_DIR`        | путь до приложения, напр. `/opt/electro`            |
| `SERVICE_NAME`   | имя systemd-сервиса, напр. `electro`                |

Учётка должна иметь право `sudo systemctl restart <SERVICE_NAME>`
без пароля (через `sudoers.d`).

## Переменные окружения

| Переменная     | По умолчанию                  | Описание                                   |
| -------------- | ----------------------------- | ------------------------------------------ |
| `PORT`         | `4000`                        | Порт сервера                               |
| `DATA_FILE`    | `server/data/works.json`      | Путь до JSON-хранилища                     |
| `CLIENT_DIST`  | `client/dist`                 | Папка с собранным клиентом                 |
| `BACKUP_DIR`   | `server/data/backups`         | Куда писать бэкапы                         |
| `BACKUP_KEEP_DAYS` | `30`                      | Сколько дней хранить старые бэкапы         |

## Бэкап и восстановление

Создать бэкап вручную:

```bash
npm run backup
```

Будет создан файл `server/data/backups/works-<timestamp>.json`.
Файлы старше `BACKUP_KEEP_DAYS` дней удаляются автоматически.

**Восстановление** — просто скопируйте нужный бэкап обратно:

```bash
cp server/data/backups/works-2026-04-15T08-30-00-000Z.json \
   server/data/works.json
sudo systemctl restart electro
```

## Скрипты npm

| Скрипт                | Что делает                                           |
| --------------------- | ---------------------------------------------------- |
| `npm run dev`         | dev-режим: сервер + клиент одновременно              |
| `npm run dev:server`  | сервер с авто-перезапуском                           |
| `npm run dev:client`  | Vite dev-server                                      |
| `npm run build`       | production-сборка клиента в `client/dist`            |
| `npm run start`       | запуск Express в production-режиме                   |
| `npm run start:prod`  | сборка + запуск                                      |
| `npm run backup`      | бэкап `works.json` в `server/data/backups`           |

## Обновление (rolling update)

Безопасная последовательность для production:

1. `npm run backup` — гарантированный бэкап.
2. `git pull` — получаем код.
3. `npm install --workspaces --omit=dev` — зависимости.
4. `npm run build` — клиент.
5. `systemctl restart electro` — рестарт.

Все эти шаги уже выполняет `scripts/deploy.sh`.
