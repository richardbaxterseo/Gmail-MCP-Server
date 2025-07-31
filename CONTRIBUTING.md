# Contributing to Gmail MCP Enhanced

Thank you for your interest in contributing! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/gmail-mcp-enhanced.git
cd gmail-mcp-enhanced

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run in development mode
npm run dev
```## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Code follows existing style
- [ ] Documentation is updated
- [ ] No credentials or personal data included
- [ ] Commit messages are clear

### PR Title Format

```
type(scope): description

Examples:
feat(search): add advanced query builder
fix(auth): handle token refresh properly
docs(setup): improve Windows instructions
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Test updates
- `chore`: Maintenance

## Security Guidelines

### Never Commit

- API keys or credentials
- OAuth tokens
- Personal email addresses
- Real email content
- Customer data### Security Checklist

- [ ] No hardcoded credentials
- [ ] Environment variables used for secrets
- [ ] Example data is anonymized
- [ ] File paths are generic
- [ ] No production URLs

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "search"

# Run with coverage
npm run test:coverage
```

### Writing Tests

```javascript
describe('Gmail Search', () => {
  it('should handle complex queries', async () => {
    const result = await gmail.search_emails({
      query: 'subject:test after:2024/01/01'
    });
    expect(result).to.have.property('messages');
  });
});
```

## Documentation

### What to Document- New functions with JSDoc
- Configuration changes
- Breaking changes
- Example usage
- Error scenarios

### Documentation Style

```javascript
/**
 * Search Gmail messages with advanced filtering
 * @param {Object} params - Search parameters
 * @param {string} params.query - Gmail search query
 * @param {number} [params.maxResults=10] - Maximum results
 * @returns {Promise<Object>} Search results
 * @throws {Error} If authentication fails
 * @example
 * const results = await searchEmails({
 *   query: 'from:example@email.com',
 *   maxResults: 20
 * });
 */
```

## Code Style

- Use TypeScript for new code
- Follow ESLint configuration
- Prefer async/await over callbacks
- Handle errors explicitly
- Add types for all parameters

## Questions?

- Open an issue for bugs
- Start a discussion for features
- Join our Discord community
- Check existing issues first