# Task Completion Checklist

When completing a task, ensure the following:

## Code Quality
1. ✅ Run `npm run lint` to check for linting errors
2. ✅ Fix any ESLint errors or warnings
3. ✅ Verify code follows project conventions (see `code_style.md`)

## Testing
1. ✅ Test the changes in development mode (`npm run dev`)
2. ✅ Verify routing works correctly (if routing was modified)
3. ✅ Test API integration (if API calls were modified)
4. ✅ Check that the UI renders correctly

## Build Verification
1. ✅ Run `npm run build` to ensure production build succeeds
2. ✅ Optionally run `npm run preview` to test production build

## Documentation
1. ✅ Update code comments if functionality changed significantly
2. ✅ Update this memory file if project structure changed
3. ✅ Update `code_style.md` if coding conventions changed

## Git (if applicable)
1. ✅ Review changes with `git status` and `git diff`
2. ✅ Commit changes with meaningful commit messages
3. ✅ Ensure no sensitive data is committed (check `.gitignore`)