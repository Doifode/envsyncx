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

