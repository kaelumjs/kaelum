// Commit messages feed release-please: the type decides the version bump and
// the subject becomes the changelog entry.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Subjects become changelog lines; allow proper nouns and code names.
    "subject-case": [0],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
