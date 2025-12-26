<!-- There is no need to worry about anything in <!-- -->  <!-- because it is the commenting syntax. You can delete the comments, but you don't need to. -->

<!--

PROJECT VERSIONING:
MAJOR.MINOR.PATCH (X.Y.Z) format:
• MAJOR (X): Breaking changes
• MINOR (Y): New features
• PATCH (Z): Bug fixes
If version is from v0.0.1 to less than v0.1.0, it's not considered a stable app with features working.
For example, if on v0.0.4 and you add a new feature, it becomes v0.1.0. If you do a major feature, becomes v1.0.0. If a bug fix (any issue with the label bug or any bug you find) it becomes v0.0.5.

-->

# Stickee Pull Request

## 📋 Description
*Please provide a clear and concise description of what this PR does and why.*

**Related Issue:** Closes #issue-number-if-applicable-otherwise-delete
<!-- Please also make sure to comment in the PR description how you fixed the issue-->


---

## 🔍 Type of Change
<!-- *Select one by placing an `x` in the appropriate box without spaces on either side, ex: [x] not [ x ]:* -->

- [ ] **Bug Fix**
- [ ] **New Feature**
- [ ] **Breaking Change**
- [ ] **Documentation Update**
- [ ] **Code Refactoring** (no functional changes)
- [ ] **Performance Improvement**
- [ ] **Other** (please describe): _____

---

## 📊 SemVer Impact Assessment
*Based on Semantic Versioning (MAJOR.MINOR.PATCH - X.Y.Z):*

**What type of version bump does this PR introduce?**

- [ ] **MAJOR (X.0.0)** - Breaking changes
- [ ] **MINOR (0.Y.0)** - New features
- [ ] **PATCH (0.0.Z)** - Bug fixes
- [ ] **NONE** - Documentation, refactoring, or chore changes

**Justification:** *Explain why this change warrants the selected version bump.*

**What version based on the questions above should Stickee be at with your Pull Request?** *For example, v1.4.9*

---


### Test Steps
*Outline steps to reproduce testing:*
1. 
2. 
3. 

---

## 📸 Screenshots / Screen Recordings
*If applicable, add screenshots or recordings to help reviewers understand visual changes:*

| Before | After |
|--------|-------|
| *Add before screenshot* | *Add after screenshot* |

---

## ✅ Checklist
*Before requesting review, ensure you have completed the following:*

### Code Quality
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding updates to the documentation

### New Version Doc
- [ ] I have created a new file in the versions folder documenting the changes I added for this version and added my username on the bottom (ex, @slammers001)

### PR Standards
- [ ] PR description is clear and comprehensive (ex, don't say added stuff as title)
- [ ] Changes are limited to a single logical piece of work
- [ ] Breaking (major) changes are clearly documented

### Dependencies
- [ ] No new warnings or errors are introduced

### Running
- [ ] I ran npm run tauri:build and it worked with a downloadable .exe file
- [ ] I ran the .exe file to make sure the app works the way I expected it to
- [ ] If it didn't, I fixed the errors and rebuilt to make sure it works

---

## 🚀 Deployment Notes
*Special considerations for deployment:*

- [ ] Environment variables need to be updated

If so, what variables need to be added

---

## ⚠️ package.json
- [ ] I have updated the package.json version line to represent the version change I would like
- [ ] I have updated the Index.tsx file in src/pages to change the version display to the version I would like
- [ ] I have updated tauri.conf.json to display the correct version as well

# Thank you for contributing!
