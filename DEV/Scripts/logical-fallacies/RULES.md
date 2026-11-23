# Episode rules for the family series

Read the [show writing guide](../video-script-prompt.md), [family bible](FAMILY_BIBLE.md) and [approved series log](SERIES_LOG.md). These rules govern episodes in this folder. The folder retains its historical name, `logical-fallacies`. Episodes about everyday life, including ones with no fallacy or argument, belong here.

## Pitching and review

For a pilot selection, offer three distinct premises. Give each a viewpoint, a recognizable occasion, what the other person wants and one later action that makes the relationship clearer. Vary the pairing and emotional texture. Stop for the user's choice before writing the script. When the user has already selected a premise, work from that choice. Confirm the language or other required inputs if missing. Preserve supplied words, approved history and user edits.

## Building the episode

Choose the moment one family member would still be thinking about later in the day. Give both sides a practical reason to be there. Think about what each already knows, what they would keep to themselves, and who has the power to change the plan. A child who says yes to a parent may need time or privacy to say what the yes cost them.

Follow the consequence of a decision. For example, a parent agrees to keep Saturday free and turns down an invitation. Later they discover that “free” meant something different to their partner. The interesting scene may be the quiet one after the calendar is settled. Use everyday settings where the relationship has room to unfold. Keep café business, town spectacles and invented competitions out of the premise.

Give each scene a reason to exist. Mark a cut to another time or place when the interval matters. Show what changed while we were away. For a silent reaction, describe something an animator can show and indicate a hold when its length matters. At production handoff, carry intended holds into dialogue gaps or the ending hold. A written note alone adds no time to the recording.

Aim for 45 seconds to 3 minutes unless the user gives another target. Count spoken words and estimate pauses using the show guide. Listen to the exchange at a speaking pace. Preserve the moment a child decides whether to answer or a parent realizes why the room has gone quiet. An episode can close on something the family will still have to live with tomorrow.

## When reasoning matters

Write the situation and the choice first. Consider the actual claim afterward. A tired refusal, a difference in taste, a broken promise or hurt feelings can be the whole conflict. A parent may have a sound reason for a decision and still owe someone a kinder explanation.

When someone does make a flawed argument, let the speaker believe their reason in that moment. Show what the argument asks the other person to accept or do. A reply can be as specific as asking when they agreed to help. Someone can notice later, notice their own mistake, or change their behaviour without naming it. Finding a weakness in someone's reason leaves the underlying decision open. Give both sides what evidence they could reasonably have.

Keep formal fallacy names out of titles, dialogue, captions and visible props. For a clear example use an optional numbered `# FALLACY 1:` note with the actual claim. If marking a spoken catch for production, use an inline comment such as `/** Fallacy 1: <name> */`. Include a `# TAKEAWAY 1:` note only for a line the character would already say. Skip these fields for an ordinary disagreement. Check the last ten approved episodes for substantially repeated arguments and circumstances.

## Voice-ready file

Save a selected script in `episodes/NN-short-title.txt`, using the next free number and a lower-case hyphenated title. The first line of every new script is exactly `# STATUS: draft`. Use this layout:

```text
# STATUS: draft
# TITLE: <story title>
# ARC: <standalone, or a specific continuing family thread>
# LENGTH: about <seconds> s, <count> spoken words
# WANT: <what the viewpoint character is counting on>
# CAST: <lower-case speaker IDs>
# PLACE: <settings and times of day>

# SEE: <the first visible action>
id: <spoken words>

# SEE: <a reaction, or a cut with the new time and place>
id: <spoken words>

# LOG UPDATE
# <proposed continuity change, or "No lasting change.">
```

Insert optional reasoning notes in the header and `# FACTS TO CHECK` before `# LOG UPDATE` for real-world claims. Add a `# SEE:` before each distinct visual beat. A silent beat can have a note of its own. Plain dialogue uses `id: spoken words`. No narrator. Lines beginning with `#` and text within `/* ... */` are unvoiced notes. Square brackets are reserved for voice and sound cues. For English and Arabic, follow the bilingual guidance in the show guide.

## Before saving

- Could this happen during an ordinary family week? Would these particular people care about the outcome?
- Does the other person's behaviour make sense from their side, even if it hurts someone?
- Can we follow what matters through speech and drawable action? Is there time to notice the reaction?
- If a character explains something the audience already saw, what happens when you cut that line?
- Does the ending show what the encounter changed, however small? Does it respect the approved history?

Deliver the draft path and stop for review. Reread the current file before revising it. A user approval or the user's change of the first line to `# STATUS: approved` authorizes recording its proposed changes in the series log. Keep voicing, storyboarding and rendering for a separate production request. Rough ideas and rejected episodes belong in `drafts/`. Demo folders contain experiments.
