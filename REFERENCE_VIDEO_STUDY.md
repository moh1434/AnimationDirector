# Directing a portrait cartoon

Use this guide when turning an existing voice track into a storyboard. The four folders in [the portrait collection](<DEV/Source Videos To Train On/portrait>) show different ways to make a line visible. Choose the technique that serves the passage. Use the project's own cast, illustrations, voices and score.

## What to look for in the references

These observations come from eight sampled frames per clip across all 14 MP4s, including the opening and ending. Times locate example frames. Use them to inspect composition and changes in subject. Exact cut lengths, word sync and sound cues require playback.

| Folder | Where to look | How to apply it |
|---|---|---|
| RickCli (4 clips) | *What If Humans Invented Teleportation*, 0.4 s, 27 s and 53 s. The labelled New York booth appears at the opening, in the lower half of a two-city comparison, and again in the closing picture. *The Job Nobody Wants in Japan*, 0.4 s and 59 s, singles out a button and later a labelled door. | Give a place one recognizable feature. Return to it after a cutaway so the audience can see what changed. Frame a sign or object closely when it carries the line. |
| HeyHistori (5 clips) | *The Lady that Became a Pirate Lord*, 5 s, 29 s and 43 s. A figure looks out toward a boat, then the figures and sails aboard the boats fill the shots. At 53 s an interior stages people across a table. | Establish where people are relative to one another. Go closer when the viewer needs to read a face, an object, or an exchange. Keep an identifiable part of the setting in view. |
| HussainAbd (2 clips) | *SecondWorldWar*, 0.4–5 s, layers a map shape above an enacted scene. At 62 s a large Arabic question occupies the frame. *SecondWorldWar2*, 112 s and 123 s, moves from a stacked comparison to a commentator below the action. | Use the vertical axis for two things the viewer must relate. A map supplies location, a character supplies scale or reaction, and a short question marks a turn. Give each a distinct area and preserve Arabic reading order. |
| uselessTru (3 clips) | *The Real Meaning of Gymnasium*, 10 s and 19 s, keeps the counter, blue sky and figures while the pose and prop change. By 38 s a single figure and bowl read against black. | Let a pose, a glance or a held object carry the joke. Keep the space around the gesture clear. An isolated reaction after a detailed setting gives the viewer time to read the consequence. |

## From a spoken passage to shots

1. **Choose the opening image from the first line.** Show the object, person or situation that makes that line interesting. If the narration opens on a question, the picture can show the puzzle before revealing its answer.
2. **Describe the change as an action.** In the visual worksheet from `build/brief.md`, record what the viewer sees before, what changes on which spoken cue, and what becomes clear afterward. Note the focal subject, the setting you keep, and any missing drawing. Save the worksheet in `build/direction-notes.md`.
3. **Choose a treatment.** For a decision or exchange, stage actors in `layout: "story"` and show the listener when their expression supplies the consequence. For a process, keep the object at the same scale and position and swap its state with `at` and `out`. For a comparison, use `compare` or stage the two subjects vertically. An off-screen narrator can carry any of these. Use `speaker: "none"` for a single off-screen voice and the measured speaker timeline for dialogue.
4. **Choose what survives the cut.** Keep the same illustrated location, wardrobe, prop ownership, eye-line and direction of travel across connected beats. Reframe with `camera.moves` to reveal a detail or reaction. A steady diagram can use `"camera": {"zoom":[1,1],"drift":false}`. Keep a new drawing on screen long enough to read the result. Use the recording to decide when to cut.
5. **Compose for the phone.** Make the important action readable at thumbnail size. Place a hand and the object it touches in view together. Fit faces, labels and captions around the reserved caption band and platform controls. Use a label for a name, place or quantity when the drawing needs it. Captions carry the spoken line.
6. **Pay off the opening.** Show the changed object, location, relationship or expression on the line that resolves it. A return to the opening composition works when the viewer can spot the difference.

**Worked beat.** Suppose a supplied line is “The water rose.” Start on the low level so the viewer has a baseline. On “rose,” replace `water_low` with `water_full` at the same coordinates and size in a fixed view. Keep both drawings still with `motion: "none"` and use `enter: "none"` for a direct swap. Hold on the higher level through the end of the phrase. Use a number only if the narration gives one. For other lines, choose the visible change the actual words describe.

## Review the sequence

- View the first image at phone size. Can you identify the subject and the situation before reading a label?
- Compare the frames before and after the cue. Can you point to what changed? At a cut, do the viewer's eye and the characters' gaze still lead to the right place?
- Play through with sound. Does the reveal land on the intended phrase? Can you read the result before the next beat? Check the busiest portrait frame with captions on.
- Use the actual local catalog, approved assets and narration. The references supply staging examples. For a factual map, likeness or figure, use verified source material.

[Art style and camera](ART_STYLE.md) · [Storyboard fields and layouts](STORYBOARD_GUIDE.md) · [Story actors and timing](STORY_MODE.md) · [Earlier five-video study from a separate collection](docs/studies/2026-11-05-five-videos.md)
