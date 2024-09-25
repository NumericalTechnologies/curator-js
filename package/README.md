# Introduction 
curator-js is a simple shared lock library that has zookeeper as a dependency, it offers features to acquire and release both read and write locks with self-recovery mechanism.

## Installation

### IDE
Download and install the latest stable version of [Visual Studio Code](https://code.visualstudio.com/).

### Extensions
[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) - Integrates ESLint JavaScript into VS Code.

[Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) - Provides Intellisense and syntax checking to Docker-related files

### Runtime Environment
Download and install the latest stable version of [Node](https://nodejs.org/en/).

### Dependency Management
Install [Pnpm](https://pnpm.io/installation)

```bash
npm install -g pnpm
```

Install all the dependencies needed to run the application.

```bash
pnpm i
# Alternative, more verbose version of installing
pnpm install
```

### How to distribute
```bash
pnpm build
```

Commit all the emitted declaration and typescript files.