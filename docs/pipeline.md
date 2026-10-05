# StackedHub CI/CD Pipeline Documentation

## Overview

The StackedHub project uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD). The pipeline automatically builds, tests, and deploys the backend API to Azure App Service whenever changes are pushed to the `main` branch.

---

## Branching Model

```mermaid
gitGraph
    commit id: "Initial setup"
    branch develop
    checkout develop
    commit id: "Feature: order tracking"
    branch feature/auth
    checkout feature/auth
    commit id: "Add JWT auth"
    checkout develop
    merge feature/auth
    commit id: "Integration tested"
    checkout main
    merge develop tag: "v1.0"
