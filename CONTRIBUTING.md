# Contributing to Equipment Maintenance Triage Assistant

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/equipment-maintenance-triage-assistant.git
   cd equipment-maintenance-triage-assistant
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```
5. **Initialize database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

## 🔧 Development Workflow

### Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Make Changes
- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update tests if needed

### Test Your Changes
```bash
# Run tests
npm test

# Run type checking
npm run build

# Test locally
npm run dev
```

### Commit Guidelines
We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat: add equipment filtering by status"

# Bug fix
git commit -m "fix: resolve triage analysis timeout"

# Documentation
git commit -m "docs: update API endpoint documentation"

# Refactor
git commit -m "refactor: optimize RAG retrieval performance"

# Tests
git commit -m "test: add tests for threshold engine"
```

**Commit Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Push and Create PR
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title describing the change
- Description of what was changed and why
- Screenshots for UI changes
- Reference any related issues

## 📋 Code Standards

### TypeScript
- Use TypeScript strict mode
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Document complex types

```typescript
// ✅ Good
interface TriageResult {
  priority: Priority;
  reasoning: string;
  confidence: number;
}

// ❌ Bad
const result: any = await triage();
```

### React Components
- Use functional components
- Implement proper error boundaries
- Use React hooks correctly
- Extract reusable logic into custom hooks

```typescript
// ✅ Good
export default function ReportPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const { showToast } = useToast();
  
  useEffect(() => {
    fetchReports();
  }, []);
  
  // ...
}
```

### API Routes
- Validate all inputs with Zod
- Use consistent response format
- Implement proper error handling
- Add authentication checks

```typescript
// ✅ Good
export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    const body = await request.json();
    const validated = schema.parse(body);
    
    const result = await service.create(validated, user.id);
    
    return NextResponse.json({
      success: true,
      data: result,
      error: null
    });
  } catch (error) {
    return handleError(error);
  }
}
```

### Testing
- Write tests for business logic
- Test edge cases
- Use descriptive test names
- Mock external dependencies

```typescript
describe('ThresholdEngine', () => {
  it('should return CRITICAL when temperature exceeds 90°C', () => {
    const result = engine.evaluate([
      { name: 'temperature', value: 95, unit: '°C' }
    ]);
    expect(result.priority).toBe('CRITICAL');
  });
});
```

## 🎨 UI/UX Guidelines

### Design System
- Use existing components from `components/ui/`
- Follow glassmorphism + gradient pattern
- Maintain color consistency:
  - Blue/Indigo: Equipment & Dashboard
  - Orange/Amber: Reports
  - Emerald/Teal: Work Orders
  - Purple/Pink: Knowledge Base

### Accessibility
- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation
- Maintain color contrast ratios

### Responsive Design
- Test on mobile, tablet, desktop
- Use Tailwind responsive classes
- Avoid fixed widths

## 📝 Documentation

### Code Comments
```typescript
// Good comments explain WHY, not WHAT
// ✅ Good: "Threshold is lower for pumps due to manufacturer spec"
const pumpThreshold = 75;

// ❌ Bad: "Set pump threshold to 75"
const pumpThreshold = 75;
```

### API Documentation
Update README.md when adding/changing endpoints:
```markdown
### Equipment
- `GET /api/equipment` - List all equipment
  - Query params: `status`, `type`, `page`, `limit`
  - Returns: `{ data: Equipment[], total: number }`
```

### Architecture Documentation
Update ARCHITECTURE.md for significant changes:
- New services
- Database schema changes
- Integration with external systems

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Numbered steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
   - OS: Windows/Mac/Linux
   - Node version
   - Browser (if UI issue)
6. **Screenshots**: If applicable
7. **Error Messages**: Full stack traces

## 💡 Feature Requests

When requesting features:

1. **Problem Statement**: What problem does it solve?
2. **Proposed Solution**: How would it work?
3. **Alternatives**: Other approaches considered?
4. **Additional Context**: Mockups, examples, etc.

## 🔒 Security

### Reporting Security Issues
**DO NOT** open public issues for security vulnerabilities.

Instead, email security concerns to the maintainer privately.

### Security Best Practices
- Never commit secrets (.env, API keys, passwords)
- Validate all user inputs
- Use parameterized queries (Prisma handles this)
- Implement rate limiting for public endpoints
- Keep dependencies updated

## 📦 Pull Request Process

1. **Update Documentation**: README, ARCHITECTURE, etc.
2. **Add Tests**: Ensure new code is tested
3. **Run Full Test Suite**: `npm test`
4. **Check TypeScript**: `npm run build`
5. **Update CHANGELOG**: If applicable
6. **Request Review**: Tag maintainers

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] No console.log() statements
- [ ] Environment variables added to .env.example
- [ ] Database migrations documented

## 🚫 What NOT to Include

- ❌ Credentials or API keys
- ❌ Large binary files
- ❌ Generated files (.next/, node_modules/)
- ❌ Personal IDE configurations
- ❌ Commented-out code
- ❌ Debug logs

## 📊 Performance Considerations

- Optimize database queries (use indexes)
- Minimize API calls (batch when possible)
- Use React.memo for expensive components
- Implement pagination for large lists
- Profile before and after changes

## 🎯 Priority Areas for Contribution

We welcome contributions in these areas:

1. **Testing**: Increase test coverage
2. **Accessibility**: WCAG compliance improvements
3. **Performance**: Query optimization, caching
4. **Documentation**: Examples, tutorials
5. **Internationalization**: Multi-language support
6. **Mobile**: Native app development
7. **Integrations**: Email, calendar, IoT sensors

## 📞 Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open an Issue
- **Features**: Open an Issue with "Feature Request" label
- **Security**: Email maintainer privately

## 🙏 Code of Conduct

### Our Standards

- ✅ Be respectful and inclusive
- ✅ Welcome newcomers
- ✅ Accept constructive criticism
- ✅ Focus on what's best for the project

### Unacceptable Behavior

- ❌ Harassment or discrimination
- ❌ Trolling or insulting comments
- ❌ Personal or political attacks
- ❌ Publishing private information

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
