# envsyncx

A local CLI tool for managing `.env` profiles per project. Save, switch, sync, diff, and audit environment variable sets without ever committing secrets.

---

## Installation

```bash
npm install -g envsyncx
```

The global binary is `esync`.

---

## Quick Start

```bash
# 1. Inside your project, initialize envsyncx
esync init

# 2. Save your current .env as a profile
esync save development

# 3. Switch to a different profile
esync switch production

# 4. List all profiles (active one is marked)
esync list
```

---

## Commands

### `esync init`
Initializes envsyncx for the current project.

- Prompts for the **source-of-truth** file (e.g. `.env.example`)
- Prompts for a project name and an initial profile name
- Creates the `.envsyncx/` local store
- Automatically adds `.env` to `.gitignore` if not already present

```bash
esync init
```

---

### `esync save <profile>`
Snapshots the current `.env` into a named profile.

- If `.env` does not exist, reads the source-of-truth file and prompts for each value, then creates `.env`
- Warns before overwriting an existing profile

```bash
esync save development
esync save staging
```

---

### `esync switch <profile>`
Restores `.env` from a saved profile and marks it as the active profile.

```bash
esync switch production
```

---

### `esync list`
Lists all saved profiles. The currently active profile is marked with `*`.

```bash
esync list

# Profiles:
# * development  (active)
#   staging
#   production
```

---

### `esync sync <profile>`
Reconciles a saved profile against the source-of-truth file.

- Prompts for values of **new keys** added to the source-of-truth
- Removes **stale keys** that no longer exist in the source-of-truth
- Switches `.env` to the updated profile when changes are made

```bash
esync sync development
```

---

### `esync doctor`
Audits the current `.env` against the source-of-truth file.

- Lists **missing variables** (in source-of-truth but not in `.env`)
- Lists **stale variables** (in `.env` but not in source-of-truth) and offers to remove them interactively
- Prompts to fill in any missing values

```bash
esync doctor
```

---

### `esync desc`
Interactively select a profile and display all its key-value pairs.

```bash
esync desc
```

---

### `esync diff <profile1> [profile2]`
Shows the differences between two profiles, or between a profile and the current `.env`.

- Keys only in one side are shown in **green** (added) or **red** (removed)
- Keys present in both but with different values are shown with the change

```bash
# Diff two profiles
esync diff development production

# Diff a profile against the current .env
esync diff staging
```

---

### `esync copy <sourceProfile> <newProfile>`
Duplicates an existing profile under a new name.

```bash
esync copy development development-backup
```

---

### `esync delete <profile>`
Deletes a profile and removes it from the profile list.

```bash
esync delete old-profile
```

---

### `esync rename <oldProfile> <newProfile>`
Renames an existing profile.

```bash
esync rename dev development
```

---

### `esync set-source <file>`
Changes the source-of-truth file for the project and runs `doctor` to check alignment.

```bash
esync set-source .env.example
esync set-source .env.schema
```

---

## How It Works

Profiles are stored locally inside a `.envsyncx/` directory at the root of your project. Each profile is a JSON file keyed by variable name.

```
.envsyncx/
  <uniquePath>/
    <projectName>/
      config.json       ← project metadata, profile list, active profile
      development.json  ← profile snapshot
      staging.json
      production.json
```

The `config.json` tracks:
| Field | Description |
|-------|-------------|
| `project` | Project name |
| `fullPath` | Unique CWD-based identifier to prevent name collisions |
| `sourceOfTruth` | The reference env file (e.g. `.env.example`) |
| `profiles` | Array of saved profile names |
| `activeProfile` | The last profile switched to |

---

## .gitignore

`esync init` automatically adds `.env` to your `.gitignore`. The `.envsyncx/` directory is **local only** — add it to `.gitignore` yourself if you do not want to commit profiles:

```
.env
.envsyncx/
```

---

## Tech Stack

- [Node.js](https://nodejs.org) + TypeScript
- [commander](https://github.com/tj/commander.js) — CLI framework
- [inquirer](https://github.com/SBoudrias/Inquirer.js) — interactive prompts
- [chalk](https://github.com/chalk/chalk) — terminal colours
- [dotenv](https://github.com/motdotla/dotenv) — `.env` parsing
- [fs-extra](https://github.com/jprichardson/node-fs-extra) — file utilities
