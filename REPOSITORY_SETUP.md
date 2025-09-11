# Altus 4 SDK - Standalone Repository Setup Guide

This document outlines how to set up the Altus 4 TypeScript SDK as a standalone npm package and GitHub repository.

## 🎯 Overview

The SDK has been transformed into a production-ready npm package with:

- **Professional package.json** with proper metadata and scripts
- **Comprehensive TypeScript configuration** for building npm packages
- **CI/CD workflows** for automated testing and publishing
- **Complete documentation** and contribution guidelines
- **Testing infrastructure** with Jest and coverage reporting
- **Code quality tools** (ESLint, Prettier, Husky)

## 📁 Repository Structure

```
altus4-sdk-typescript/
├── .github/                    # GitHub templates and workflows
│   ├── workflows/
│   │   ├── ci.yml             # Continuous integration
│   │   └── publish.yml        # NPM publishing
│   ├── ISSUE_TEMPLATE/        # Bug and feature templates
│   └── pull_request_template.md
├── scripts/                   # Setup and maintenance scripts
├── src/                       # TypeScript source code
├── tests/                     # Test files
├── dist/                      # Built JavaScript (generated)
├── coverage/                  # Test coverage (generated)
├── package.json               # Package configuration
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest testing configuration
├── README.md                 # Comprehensive documentation
├── LICENSE                   # MIT license
├── CONTRIBUTING.md           # Contribution guidelines
├── CHANGELOG.md              # Version history
└── .npmignore               # Files to exclude from npm package
```

## 🚀 Quick Setup

Run the setup script to initialize everything:

```bash
cd /path/to/sdk
chmod +x scripts/setup-repository.sh
./scripts/setup-repository.sh
```

## 📋 Manual Setup Steps

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create repository named `altus4-sdk-typescript`
3. Don't initialize with README (we have our own)

### 2. Initialize Git Repository

```bash
cd /path/to/sdk
git init
git remote add origin https://github.com/altus4/altus4-sdk-typescript.git
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Build and Test

```bash
# Build the package
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Check formatting
npm run format:check
```

### 5. Commit and Push

```bash
git add .
git commit -m "feat: initial SDK release"
git branch -M main
git push -u origin main
```

## 📦 NPM Publishing Setup

### 1. NPM Account Setup

1. Create account on [npmjs.com](https://www.npmjs.com)
2. Generate access token:
   - Go to [npm access tokens](https://www.npmjs.com/settings/tokens)
   - Click "Generate New Token"
   - Choose "Automation" type
   - Copy the token

### 2. GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to repository Settings → Secrets and variables → Actions
2. Add `NPM_TOKEN` with your npm access token

### 3. Publishing Methods

**Automatic (Recommended):**
1. Create a GitHub release
2. CI/CD will automatically publish to npm

**Manual:**
```bash
# Publish latest version
npm run release

# Publish beta version
npm run release:beta
```

## 🔧 Development Workflow

### Branch Strategy
- `main` - Production releases
- `develop` - Development branch
- `feature/*` - Feature branches

### Commit Convention
```
feat: add new feature
fix: fix a bug
docs: update documentation
test: add tests
refactor: refactor code
chore: maintenance tasks
```

### Pre-commit Hooks
Automatically run on commit:
- ESLint fixing
- Prettier formatting
- Type checking

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Test Structure
- Unit tests in `tests/` directory
- Mock external dependencies
- Aim for >80% coverage

## 📝 Documentation

### API Documentation
- Comprehensive README with examples
- JSDoc comments for all public APIs
- TypeScript definitions included

### Generate Docs
```bash
npm run docs:build
```

## 🔍 Code Quality

### Linting
```bash
npm run lint          # Check issues
npm run lint:fix      # Fix automatically
```

### Formatting
```bash
npm run format        # Format code
npm run format:check  # Check formatting
```

## 🚀 CI/CD Pipeline

### Continuous Integration
Runs on every push and PR:
- Multi-version Node.js testing (14.x, 16.x, 18.x, 20.x)
- Linting and formatting checks
- Type checking
- Test execution with coverage
- Security audit
- Package validation

### Publishing Pipeline
Triggers on releases:
- Full test suite
- Build verification
- NPM publishing with provenance
- Automatic GitHub releases

## 📊 Package Features

### Modern Package Configuration
- ESM and CommonJS support
- Proper entry points
- TypeScript definitions
- Tree-shaking support
- Provenance publishing

### Dependencies
- Minimal runtime dependencies (only axios)
- Comprehensive dev dependencies
- Peer dependency on TypeScript

### Browser Support
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- Node.js 14+

## 🔒 Security

### Audit Configuration
```bash
npm audit --audit-level moderate
```

### Dependabot
- Automatic dependency updates
- Security vulnerability alerts
- Configured in `.github/dependabot.yml`

## 📈 Monitoring

### Package Health
- Download statistics on npm
- GitHub repository insights
- CI/CD success rates

### Metrics to Track
- Download counts
- Issue resolution time
- Test coverage percentage
- Build success rate

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines:
- Development setup
- Code standards
- Testing requirements
- Pull request process

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 🆘 Troubleshooting

### Common Issues

**Build Failures:**
- Check TypeScript configuration
- Verify all dependencies are installed
- Ensure Node.js version compatibility

**Publishing Issues:**
- Verify NPM token is correct
- Check package name availability
- Ensure version is incremented

**Test Failures:**
- Review test setup configuration
- Check mock implementations
- Verify environment compatibility

### Getting Help
- Create an issue on GitHub
- Review existing documentation
- Check CI/CD logs for errors

## 🎉 Success Checklist

- [ ] GitHub repository created
- [ ] Dependencies installed
- [ ] Build succeeds
- [ ] Tests pass
- [ ] CI/CD workflows active
- [ ] NPM token configured
- [ ] Documentation reviewed
- [ ] First release published

Your Altus 4 SDK is now ready for standalone development and distribution! 🚀