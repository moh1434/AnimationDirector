# Episode rules: *It Made Sense at the Time*

Read the [family bible](FAMILY_BIBLE.md) and the [series log](SERIES_LOG.md) first. The folder keeps its historical name, `logical-fallacies`.

Every episode must, in this order: make people laugh, make them care about this family, and leave them able to spot one thinking mistake. The mistake can come from logical fallacies, critical thinking, cognitive biases, logical reasoning, probability and statistics, scientific thinking or decision making.

## The mistake is the plot

Remove the mistake and no story should be left. Aim for about 60–100 seconds.

1. **Hook, 0–3 s.** The strangest result or claim, already happening.
2. **The reason.** Why it makes sense to this person. It must be tempting: half the viewers should nod.
3. **It grows.** They act on it. Somebody copies it, or fights it with a mistake of their own.
4. **Reality answers.** Something happens that the idea can't survive. Best of all, they meet their own logic in another mouth.
5. **Button.** They pay for it, laugh about it, or start it again in a new form. The last spoken line is a joke.
6. **Name card, 2–3 s, silent.** The mistake's name and one plain sentence. Nobody in the story ever says the name.

## Rules that keep it funny and honest

- **No one is the teacher.** Who sees the mistake changes from episode to episode, and nobody is always right. An event breaks the mistake, not an explanation.
- **Nobody is stupid.** Every mistake has a real feeling under it, and comes from who that person is.
- **One mistake per episode** gets the card. Other characters may make small ones for color.
- **Use the right name.** Check the mistake against a reliable source. The break must defeat the reasoning, not only one fact in it.
- **A bad reason can reach a true answer.** Sometimes show that. Now and then, show good reasoning that only looks like the mistake.
- **A family scene, not a debate.** At most one line may explain, and it must also be a joke or hurt.
- **The biggest laugh is the mistake itself.** Never joke first and teach later.
- **One honest moment,** about five seconds, never skipped and never a speech.
- **Each episode works alone.** Show a fact on screen before relying on it. Episode 1 starts the day Benny quits.
- **Bring mistakes back** with another person in another setting. Check the log so a mistake does not repeat within ten episodes in the same kind of situation.
- **It must work in Arabic.** No wordplay that exists only in English. The card is translated too (`translations.json`).
- **Light and family-safe.** Tease, don't despise. No real people, brands or living celebrities as the butt of a joke.

"Spot it" quiz episodes (30–40 s) give viewers practice: new lines from the family, and which mistake is it?

## Pitching and review

For a new idea, offer three premises: who is wrong, the mistake, why it tempts them, what reality does, and the last joke. When the user has already chosen, work from that choice. Preserve supplied words, approved history and user edits. Confirm the language if it is missing.

When the user asks for versions, save them as `NN-title-a.txt`, `-b`, `-c`, and stop for a choice.

## Writing for voice and picture

- Use character dialogue and visible action. The show has no narrator. Keep the exchange easy to follow by ear. Give the listener room to register a change of feeling.
- Write one breath per line, usually 4–14 words and always under 200 characters. Allow short answers and unfinished thoughts. Speakers take turns. Spell numbers as spoken. Keep performance directions outside spoken text.
- Favour one or two familiar settings, a few speakers and simple actions readable on a phone. A look at an empty seat is easier to stage than a close-up of a long message. Avoid relying on legible screens, crowds, logos or intricate hand movements.
- At script stage, establish language and any requested runtime. For a bilingual episode write English first, then natural spoken Arabic with the same speakers, lines and order. Choose humour that travels. Keep brand names in Latin letters when supplied. Avoid semicolons in Arabic dialogue. Leave production notes outside both voice tracks.
- Record factual claims that need checking under `# FACTS TO CHECK`. Keep invented family incidents distinct from claims about the real world.

### Estimating length

Use the project's measured voice speeds in words per second. Use the fallback for Wendy and other unmeasured voices.

| Voice | English | Arabic |
| --- | ---: | ---: |
| Benny | 2.42 | 1.75 |
| Berry | 2.92 | 1.85 |
| Cherry | 2.89 | 1.95 |
| Fallback | 2.4 | 1.8 |

Add each speaker's word count divided by their speed. Allow roughly 0.25 seconds per line for ordinary gaps. For a longer reaction, replace that gap with the intended hold. Add wordless opening or ending time separately. Estimate each language independently. If the scene feels rushed, try removing a spoken explanation and listening through the intended silence. Final recordings determine timing.

## Voice-ready file

Save a selected script in `episodes/NN-short-title.txt`, using the next free number and a lower-case hyphenated title. The first line of every new script is exactly `# STATUS: draft`. Use this layout:

```text
# STATUS: draft
# TITLE: <story title>
# LENGTH: about <seconds> s, <count> spoken words
# WRONG: <who>
# MISTAKE: <its correct name> | <field> | "<the claim in their words>"
# TEMPTING BECAUSE: <why a sensible person could think it>
# REALITY: <the event that breaks it>
# HONEST MOMENT: <the five seconds that matter>
# CARD: <NAME>: <one plain sentence>
# CAST: <lower-case speaker IDs>
# PLACE: <settings and times of day>

# SEE: <the first visible action>
id: <spoken words>

# SEE: <a reaction, or a cut with the new time and place>
id: <spoken words>

# LOG UPDATE
# <proposed continuity change, or "No lasting change.">
```

Put real-world claims under `# FACTS TO CHECK` before `# LOG UPDATE`. Add a `# SEE:` before each distinct visual beat. Plain dialogue uses `id: spoken words`. No narrator. Lines beginning with `#` and text within `/* ... */` are unvoiced. Square brackets are reserved for voice and sound cues. The card is drawn on screen after the last line and is not voiced.

## Before saving

**Funny:** Would a stranger laugh at least once with the sound off? Is the biggest laugh the mistake? Could you name each speaker without the label? Is there a surprise in the last ten seconds? Cut any line that only explains.

**Useful:** Without the mistake, does the plot collapse? Is it tempting? Is it the right name? Could the viewer spot it tomorrow somewhere else? Did an event, not a person, defeat the reasoning?

**Believable:** Does each person act for their own reason? Can an animator draw every action? Does it respect the log?

Deliver the draft path and stop for review. Reread the current file before revising it. A user approval, or the user's change of the first line to `# STATUS: approved`, authorizes recording its proposed changes in the series log. Keep voicing, storyboarding and rendering for a separate production request. Rough ideas and rejected episodes belong in `drafts/`.
