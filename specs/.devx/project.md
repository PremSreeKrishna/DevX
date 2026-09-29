# AI Reporting Platform

> Auto-generated project context for AI-assisted development.
> Last updated: 2026-09-23

**Organization:** delta-studio

## Overview

PostgreAPI – AI Reporting Platform: Developed an AI-powered platform that enables users to query PostgreSQL databases using natural language. The system uses an LLM to understand user queries, generate SQL, retrieve data from PostgreSQL, and present the results through an interactive Streamlit interface, with FastAPI and MCP-based backend services.

## Development Methodology

This project follows **Spec-Driven Development (SDD)**.

Every feature has:
- `specs.md` — Full technical specification
- `requirements.md` — Implementation acceptance checklist
- `prompt.md` — Ready-to-use implementation prompt

## Features (1)

- **LLM Intent Interpretation for Natural-Language Questions; As a Data Governance Administrator, I want LLM-generated reporting queries constrained by approved PostgreSQL rules so that sensitive automotive data is protected during AI-assisted reporting; As an Automotive Reporting Analyst, I want query results returned through an interactive interface with status feedback so that I can review PostgreSQL data efficiently and trust the reporting outcome (+23 more)** (26 user stories)

## Getting Started

1. Read this file for project context
2. Check `specs/.devx/workflow.md` for the development workflow
3. Review `specs/.devx/instruction.md` for architecture and multi-repo rules
4. Pick a feature from `specs/.devx/features.json`
5. Open the feature's `prompt.md` and use it with your AI assistant
6. Follow the spec and requirements to implement

## Project Structure

```
specs/
  .devx/
    project.md          ← You are here
    workflow.md          ← Development workflow
    features.json        ← Feature index (machine-readable)
    tracker.json         ← Code-generation execution status
    generation.json      ← Last generation metadata
    architecture.md      ← System architecture
    init.sh              ← Setup AI tool configs
  <feature-slug>/
    specs.md             ← Technical specification
    requirements.md      ← Implementation acceptance checklist
    prompt.md            ← Implementation prompt
```

## AI Tool Setup

Run the init script to configure your AI tools automatically:

```bash
bash ./specs/.devx/init.sh
```

If you want execute permissions as well:

```bash
  chmod +x ./specs/.devx/init.sh && ./specs/.devx/init.sh
```

The script lists supported AI tools, lets you choose one, and creates only that tool's config files.
