# envsyncx

> A local CLI tool for managing `.env` profiles per project — save, switch, diff, audit, and protect environment variables without ever committing secrets.

---

## Why We Built This

Every developer has dealt with the `.env` problem:

- You juggle **multiple environments** (local, staging, production) but `.env` only holds one at a time.
- Switching environments means **manually editing** files, copy-pasting values, or keeping a messy collection of `.env.local`, `.env.staging`, `.env.prod` files.
- New teammates run `npm install` and stare at a blank `.env` with no idea what values to fill in.
- You accidentally **commit secrets** because you forgot `.env` was untracked.
- There's no history — one wrong edit and your working config is gone.

**envsyncx** solves all of this. It gives your `.env` the same first-class treatment as your source code: named profiles, instant switching, diffs, history, rollback, and team-friendly tooling — entirely local, no cloud, no accounts.

---

## Installation

```bash
npm install -g envsyncx
```

The global binary is `esync`.

---

## Quick Start

```bash
# 1. Initialize envsyncx inside your project
esync init

# 2. Save your current .env as a named profile
esync save development

# 3. Switch to a different profile
esync switch production

# 4. List all saved profiles
esync list
```

---

## Highlights

| Feature | Description |
|---|---|
| **Named profiles** | Save any number of `.env` snapshots per project |
| **Instant switching** | One command restores a full environment |
| **Local or global storage** | Store profiles inside the project or in `~/.envsyncx` (shared across machines) |
| **Source-of-truth sync** | Keeps profiles aligned with `.env.example` as it evolves |
| **Diff & compare** | Side-by-side diff between profiles or against live `.env` |
| **History & rollback** | Every change is tracked; restore any past snapshot |
| **Secret scanning** | Detects weak or placeholder secrets; AES-256 encryption built in |
| **Cherry-pick & merge** | Pull selected variables from one or many profiles |
| **Variable groups** | Organise related variables (db, api, auth) and apply them as a unit |
| **Doctor** | Audits live `.env` for missing, stale, or suspicious values |
| **Zero cloud** | Everything stays on your machine — no accounts, no sync servers |

---

## Storage Modes

When you run `esync init` you choose where profiles are stored:

```
? Where do you want to store your profiles?
❯ Current project folder  (.envsyncx/ inside this project)
  Default global folder   (~/.envsyncx)
```

| Mode | Location | Best for |
|---|---|---|
| **Local** | `<project>/.envsyncx/` | Per-repo isolation; profiles travel with the repo |
| **Global** | `~/.envsyncx/` | Shared machine-wide store; nothing added to the project folder |

Each project is identified by a **16-character SHA-256 hash** of its path, so there are no naming collisions even across projects with the same name.

```
~/.envsyncx/
  a3f8c21d94b07e15/       ← unique project ID (hash of project path)
    my-app/
      config.json
      development.json
      staging.json
```

---

## Commands

### `esync init`
Initialises envsyncx for the current project.

- Prompts for storage location (local project folder or global `~/.envsyncx`)
- Prompts for the **source-of-truth** file (e.g. `.env.example`)
- Prompts for a project name and an initial profile name
- Automatically adds `.env` (and `.envsyncx/` for local mode) to `.gitignore`

```bash
esync init
```

---

### `esync save <profile>`
Snapshots the current `.env` into a named profile.

- If `.env` does not exist, prompts for every key from the source-of-truth file and creates it
- Warns before overwriting an existing profile

```bash
esync save development
esync save staging
```

---

### `esync switch <profile>`
Restores `.env` from a saved profile and marks it as active.

```bash
esync switch production
```

---

### `esync list`
Lists all saved profiles. The active profile is marked with `*`.

```bash
esync list
# * development  (active)
#   staging
#   production
```

---

### `esync sync <profile>`
Reconciles a saved profile against the source-of-truth file.

- Prompts for values of **new keys** added since the profile was saved
- Removes **stale keys** that no longer exist in the source-of-truth
- Switches `.env` to the updated profile

```bash
esync sync development
```

---

### `esync diff <profile1> [profile2]`
Shows differences between two profiles, or between a profile and the current `.env`.

```bash
esync diff development production   # compare two profiles
esync diff staging                  # compare profile vs live .env
```

---

### `esync doctor`
Audits the current `.env` against the source-of-truth file.

- Lists **missing variables** and offers to fill them in
- Lists **stale variables** and offers to remove them

```bash
esync doctor
```

---

### `esync apply <profile>`
Interactively select which variables from a profile to copy into `.env`.

```bash
esync apply production
# checkbox list → select only the variables you need
```

---

### `esync pick <profile> [--reveal]`
Cherry-pick variables with a live diff preview.

```bash
esync pick production
# ➕ NEW_VAR        (new in production)
# ~  CHANGED_VAR   (different value)
# =  SAME_VAR      (unchanged)
```

---

### `esync merge <profile1> <profile2> [...]`
Merge variables from multiple profiles into `.env`, with source tracking and conflict resolution.

```bash
esync merge dev staging
```

---

### `esync compare-all [--reveal]`
Matrix comparison table across all profiles. Select variables to apply.

```bash
esync compare-all
esync compare-all --reveal   # unmask secret values
```

---

### `esync search <keyword> [--reveal]`
Search for a variable by name or value across all profiles.

```bash
esync search DATABASE
```

---

### `esync extract`
Extract a subset of variables from `.env` into a new named profile.

```bash
esync extract
# multi-select variables → enter profile name → done
```

---

### `esync wizard`
Step-by-step interactive profile builder: choose a base, inherit variables, modify, and save.

```bash
esync wizard
```

---

### `esync history [list|rollback|clear]`
Automatic change tracking for `.env`.

- Last **20 snapshots** are stored automatically on every switch/apply
- Rollback to any past state with a single selection

```bash
esync history list
esync history rollback
esync history clear
```

---

### `esync secrets <action>`
Secret management for `.env`.

| Action | Description |
|---|---|
| `scan` | Find weak, placeholder, or short secrets |
| `encrypt` | AES-256-CBC encrypt selected variables (`enc:iv:data`) |
| `decrypt` | Decrypt previously encrypted variables |
| `generate-key` | Generate a strong random encryption key |

```bash
esync secrets scan
esync secrets encrypt
esync secrets generate-key
```

---

### `esync groups <action> [args]`
Organise variables into named groups (e.g. `database`, `api`, `auth`) and apply them as a unit.

```bash
esync groups create database
esync groups add database DB_HOST DB_PORT DB_NAME
esync groups apply database production
esync groups list
```

---

### `esync validate`
Detect missing, empty, and suspicious variable values with interactive fixes.

```bash
esync validate
```

---

### `esync batch-delete`
Delete multiple profiles at once via checkbox selection.

```bash
esync batch-delete
```

---

### `esync copy <source> <new>`
Duplicate an existing profile under a new name.

```bash
esync copy development development-backup
```

---

### `esync rename <old> <new>`
Rename an existing profile.

```bash
esync rename dev development
```

---

### `esync delete <profile>`
Delete a single profile.

```bash
esync delete old-profile
```

---

### `esync set-source <file>`
Change the source-of-truth file and re-run doctor to check alignment.

```bash
esync set-source .env.schema
```

---

### `esync desc`
Interactively select a profile and display all its key-value pairs.

```bash
esync desc
```

---

## How It Works

```
.envsyncx/
  <16-char project hash>/
    <project-name>/
      config.json       ← metadata: source-of-truth, profile list, active profile, groups
      development.json  ← profile snapshot
      staging.json
      production.json
      history.json      ← last 20 .env snapshots
```

The `config.json` tracks:

| Field | Description |
|---|---|
| `project` | Project name |
| `fullPath` | SHA-256 hash of the project path (collision-safe unique ID) |
| `sourceOfTruth` | Reference env file (e.g. `.env.example`) |
| `profiles` | Array of saved profile names |
| `activeProfile` | Last profile switched to |
| `groups` | Named variable groups |

---

## .gitignore

`esync init` manages `.gitignore` automatically:

- **Local mode** — adds `.env` and `.envsyncx/`
- **Global mode** — adds `.env` only (nothing else is written to the project)

---

## Tech Stack

- [Node.js](https://nodejs.org) + TypeScript
- [commander](https://github.com/tj/commander.js) — CLI framework
- [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js) — interactive prompts
- [chalk](https://github.com/chalk/chalk) — terminal colours
- [dotenv](https://github.com/motdotla/dotenv) — `.env` parsing
- [fs-extra](https://github.com/jprichardson/node-fs-extra) — file utilities

---

## License

MIT


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

---

## 🎯 Multi-Select Features

### `esync apply <profile>`
**Select specific variables from a profile to apply to .env**

Interactively choose which variables to copy from a profile:
```bash
esync apply production
# Shows checkbox list of all variables
# Select only the ones you need
# Press space to toggle, enter to confirm
```

### `esync merge <profile1> <profile2> [profile3...]`
**Merge variables from multiple profiles**

Combine variables from different profiles with source tracking:
```bash
esync merge dev staging production
# Shows all variables from all profiles
# Each variable labeled with source profile
# Select which ones to merge into .env
```

### `esync pick <profile> [--reveal]`
**Cherry-pick variables with conflict resolution**

Interactive diff that shows what will change:
```bash
esync pick production
# Shows:
#   + NEW_VAR (new from production)
#   ~ CHANGED_VAR (different value)
#   = SAME_VAR (unchanged)
# Multi-select which changes to apply
```

### `esync batch-delete`
**Delete multiple profiles at once**

```bash
esync batch-delete
# Shows all profiles with checkboxes
# Select multiple to delete
# Confirms before deletion
```

### `esync extract`
**Extract variables from .env to a new profile**

```bash
esync extract
# Multi-select variables from current .env
# Creates new profile with only selected vars
# Useful for sharing subset of config
```

### `esync compare-all [--reveal]`
**Matrix view of all profiles**

Visual comparison across all profiles:
```bash
esync compare-all
# Shows table:
# Variable    | dev     | staging | production
# DB_HOST     | local   | stage-db| prod-db
# API_KEY     | ****    | ****    | ****
# 
# Multi-select rows to copy to .env
# If multiple profiles have a var, prompts which to use
```

### `esync search <keyword> [--reveal]`
**Search variables across all profiles**

```bash
esync search DATABASE
# Finds all variables containing "DATABASE"
# Shows which profiles contain matches
# Multi-select to view details
```

### `esync validate`
**Validate .env and fix issues interactively**

Detects:
- Missing required variables (from source-of-truth)
- Empty values
- Suspicious patterns (placeholders in sensitive fields)

```bash
esync validate
# Shows all issues with checkboxes
# Multi-select which to fix
# Prompts for corrections
```

---

## 🔧 Advanced Features

### `esync groups <action> [args]`
**Manage variable groups**

Organize variables by category (e.g., database, api, auth):

```bash
# Create a group
esync groups create database

# Add variables to a group (interactive or manual)
esync groups add database DB_HOST DB_PORT DB_NAME

# List all groups
esync groups list

# Apply only a specific group from a profile
esync groups apply production database

# Remove variables from a group
esync groups remove database DB_HOST

# Delete a group
esync groups delete database
```

### `esync wizard`
**Interactive profile creation wizard**

Step-by-step profile builder:
```bash
esync wizard
# 1. Enter profile name
# 2. Choose base profile (optional)
# 3. Select variables to inherit
# 4. Add/modify/remove variables
# 5. Review and save
```

### `esync history [action]`
**View and manage .env change history**

Automatically tracks changes with rollback capability:

```bash
# List history
esync history
esync history list

# Rollback to a previous snapshot
esync history rollback

# Clear all history
esync history clear
```

History shows:
- Timestamp (relative time)
- Action performed
- Profile involved
- Number of variables in snapshot

### `esync secrets <action> [args]`
**Scan and manage secrets**

#### Scan for security issues
```bash
# Scan all profiles
esync secrets scan

# Scan specific profile
esync secrets scan production
```

Detects:
- Placeholder values in sensitive fields
- Suspiciously short values
- Empty sensitive variables

#### Encrypt sensitive values
```bash
esync secrets encrypt production
# Multi-select variables to encrypt
# Enter encryption key (min 32 chars)
# Values stored as: enc:iv:encrypted_data
```

#### Decrypt sensitive values
```bash
esync secrets decrypt production
# Multi-select encrypted variables
# Enter encryption key
# Values restored to plain text
```

#### Generate encryption key
```bash
esync secrets generate-key
# Generates a secure random key
```

---

## Common Workflows

### Setting up a new environment
```bash
esync init
esync save dev
esync wizard  # Create staging profile
esync wizard  # Create production profile
```

### Safely updating production
```bash
esync pick production --reveal
# Review changes before applying
# Select only what you need
```

### Organizing by feature
```bash
esync groups create authentication
esync groups add authentication JWT_SECRET AUTH_URL AUTH_PROVIDER
esync groups apply production authentication
```

### Emergency rollback
```bash
esync history rollback
# Select recent snapshot
# Instant restore
```

### Merging configurations
```bash
esync merge dev-feature staging
# Combine variables from both
# Resolve conflicts interactively
```

---

## Tips

1. **Use groups** for related variables (database, api, auth, etc.)
2. **Enable --interactive** on sync to preview changes before applying
3. **Use pick** instead of switch when you want granular control
4. **Run validate** regularly to catch configuration issues
5. **Use secrets scan** before committing profiles
6. **Keep encryption keys secure** - never commit them
7. **Use history rollback** if something goes wrong

---

**Happy Environment Management! 🚀**

