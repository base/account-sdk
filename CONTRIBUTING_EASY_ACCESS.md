# Contributing Guide - Easy Account Access

## How to Contribute

Thank you for your interest in contributing to the Easy Account Access feature! This guide will help you get started.

## Development Setup

### Prerequisites
- Node.js 16+
- Yarn or npm
- Git

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/Rhu3ee/Rhu3ee-account-sdk.git
cd Rhu3ee-account-sdk

# Install dependencies
yarn install

# Navigate to the package
cd packages/account
```

### Development Commands

```bash
# Run tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage

# Build the package
yarn build

# Lint code
yarn lint

# Format code
yarn format
```

## File Structure

```
packages/account/src/utils/
├── easyAccess.ts              # Core implementation
├── easyAccess.test.ts         # Test suite
├── EASY_ACCESS_GUIDE.md       # User guide
├── index.ts                   # Exports
└── [your-contribution]        # Your changes here
```

## Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

**For bug fixes:**
- Update the relevant function
- Add a test case
- Update documentation if needed

**For new features:**
- Implement the feature in `easyAccess.ts`
- Add comprehensive tests in `easyAccess.test.ts`
- Document in `EASY_ACCESS_GUIDE.md`
- Update exports in `index.ts`

### 3. Write Tests

Every feature needs tests. Use this template:

```typescript
describe('Your Feature', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = yourFunction(input);

    // Assert
    expect(result).toBe(expected);
  });

  it('should handle edge cases', () => {
    // Test edge cases
  });

  it('should throw on invalid input', () => {
    // Test error handling
  });
});
```

### 4. Update Documentation

If adding a feature, document it:

```typescript
/**
 * Your function description
 * 
 * @param param1 Description of parameter
 * @param param2 Description of parameter
 * @returns Description of return value
 * 
 * @example
 * const result = yourFunction('input');
 * console.log(result); // 'output'
 */
export function yourFunction(param1: string, param2?: number): string {
  // Implementation
}
```

### 5. Run Tests Locally

```bash
# Run all tests
yarn test

# Run specific test file
yarn test easyAccess.test.ts

# Check coverage
yarn test --coverage
```

Ensure:
- ✅ All tests pass
- ✅ No console errors
- ✅ Coverage maintained (>80%)

## Code Style Guidelines

### TypeScript

```typescript
// ✅ Good
export async function easyLogin(
  address: string,
  expiryHours: number = 24
): Promise<AccessToken> {
  // Implementation
}

// ❌ Avoid
export async function easyLogin(address, expiryHours = 24) {
  // Implementation
}
```

### Comments

```typescript
// ✅ Good - Explains why
// We cache tokens to reduce repeated generation
const cached = tokenCache.get(address);

// ❌ Avoid - Obvious from code
// Get the token from cache
const cached = tokenCache.get(address);
```

### Variable Names

```typescript
// ✅ Good
const isTokenValid = validateAccessToken(token);
const expiryTimeMs = expiryHours * 60 * 60 * 1000;

// ❌ Avoid
const valid = validateAccessToken(token);
const time = expiryHours * 60 * 60 * 1000;
```

## Testing Requirements

### Coverage Targets
- Statements: >85%
- Branches: >85%
- Functions: >85%
- Lines: >85%

### Test Categories

**Unit Tests** - Test individual functions
```typescript
it('should generate unique tokens', () => {
  const token1 = generateAccessToken('0x1234...', 24);
  const token2 = generateAccessToken('0x1234...', 24);
  expect(token1.token).not.toBe(token2.token);
});
```

**Integration Tests** - Test workflows
```typescript
it('should complete login/logout flow', async () => {
  await easyLogin('0x1234...');
  const session = getCurrentSession('0x1234...');
  expect(session).toBeTruthy();
  easyLogout('0x1234...');
  expect(getCurrentSession('0x1234...')).toBeNull();
});
```

**Edge Case Tests** - Test boundaries
```typescript
it('should handle expired tokens', () => {
  const expiredToken = {
    address: '0x1234...',
    token: 'test',
    expiresAt: Date.now() - 1000 // 1 second ago
  };
  expect(validateAccessToken(expiredToken)).toBe(false);
});
```

## Commit Messages

Use conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
test: add tests
refactor: refactor code
perf: improve performance
chore: maintenance task
```

Examples:
```
feat: add token refresh mechanism
fix: handle expired token edge case
docs: update API documentation
test: add edge case tests for logout
```

## Pull Request Process

### Before Submitting

1. ✅ All tests pass: `yarn test`
2. ✅ Code is formatted: `yarn format`
3. ✅ No linting errors: `yarn lint`
4. ✅ Coverage maintained: `yarn test --coverage`
5. ✅ Documentation updated
6. ✅ Commit messages follow conventions

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] All tests passing

## Documentation
- [ ] Updated README
- [ ] Updated API docs
- [ ] Added examples

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No new warnings generated
```

## Review Process

Reviewers will check:
- ✅ Code quality and style
- ✅ Test coverage
- ✅ Documentation clarity
- ✅ Performance impact
- ✅ Security concerns
- ✅ Breaking changes

## Common Tasks

### Adding a New Function

1. Add to `easyAccess.ts`
2. Add JSDoc comments
3. Add tests to `easyAccess.test.ts`
4. Export from `index.ts`
5. Document in `EASY_ACCESS_GUIDE.md`
6. Update `CHANGELOG_EASY_ACCESS.md`

### Fixing a Bug

1. Identify root cause
2. Write failing test
3. Fix the bug
4. Verify test passes
5. Update documentation if needed

### Improving Performance

1. Benchmark current performance
2. Implement optimization
3. Benchmark improved performance
4. Add performance tests if applicable
5. Document the improvement

## Getting Help

- 📚 Read [EASY_ACCESS_GUIDE.md](./EASY_ACCESS_GUIDE.md) for API docs
- 🏗️ Check [IMPLEMENTATION_GUIDE_EASY_ACCESS.md](./IMPLEMENTATION_GUIDE_EASY_ACCESS.md) for architecture
- 🧪 Look at `easyAccess.test.ts` for examples
- 💬 Ask in issues or discussions

## Reporting Issues

Include:
- ✅ Clear description of the issue
- ✅ Steps to reproduce
- ✅ Expected behavior
- ✅ Actual behavior
- ✅ Environment (Node.js version, OS, etc.)
- ✅ Code snippet if applicable

## Feature Requests

Include:
- ✅ Use case and motivation
- ✅ Expected behavior
- ✅ Example code
- ✅ Alternative solutions considered

## Code Review Checklist

When reviewing code:

- [ ] Code is readable and well-commented
- [ ] Variable and function names are clear
- [ ] Tests are comprehensive
- [ ] No console.log statements in production code
- [ ] No commented-out code
- [ ] Performance is acceptable
- [ ] No security issues
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] No breaking changes

## Performance Considerations

When contributing:
- Keep token generation O(1)
- Keep cache lookups O(1)
- Minimize memory usage
- Avoid unnecessary async operations
- Cache expensive computations

## Security Considerations

When contributing:
- Never log tokens or sensitive data
- Validate all inputs
- Use secure random generation
- Handle errors gracefully
- Follow OAuth 2.0 best practices

## Release Process

Releases follow semantic versioning:
- `MAJOR` - Breaking changes
- `MINOR` - New features
- `PATCH` - Bug fixes

Example: `0.1.0` → `0.2.0` (minor release)

## Questions?

Feel free to:
- 💬 Open an issue
- 🔗 Start a discussion
- 📧 Contact maintainers
- 📚 Check documentation

---

**Thank you for contributing! 🎉**
