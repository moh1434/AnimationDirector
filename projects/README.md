# Projects

| Folder | What goes there | Make one |
| --- | --- | --- |
| `family/` | Episodes of the family series (story mode) | `pnpm video new family/<name> --tts` |
| `explainer/` | Explainer videos: Wendy explains a topic ([EXPLAINER_MODE.md](../EXPLAINER_MODE.md)) | `pnpm video new <name> --explainer --tts`, or `new-explainer.bat` |
| `samples/` | Test projects kept as examples (`voice-test`) | |
| `old/` | Retired videos. Not in git | |
| `_template/` | Copied by `new` | |

The pipeline finds a project by its name alone in `projects/`, `family/` and `explainer/`, so `pnpm video make my-video` works wherever it is. An Arabic version (`localize`) is made next to the original. The `.bat` files inside a project find the repository by themselves, at any depth.
